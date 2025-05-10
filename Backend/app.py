import os
import io
import uuid
import sqlite3
from datetime import datetime
from typing import Optional

import requests
from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
import PyPDF2
from dotenv import load_dotenv

# --- CONFIGURATION ---
load_dotenv()  # load UPLOADCARE_PUBLIC_KEY & UPLOADCARE_SECRET_KEY from .env
UPLOADCARE_PUBLIC_KEY = os.getenv("UPLOADCARE_PUBLIC_KEY")
UPLOADCARE_SECRET_KEY = os.getenv("UPLOADCARE_SECRET_KEY")

PDF_STORAGE = "pdfs"
DB_PATH = "my_docs_store.db"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

os.makedirs(PDF_STORAGE, exist_ok=True)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# — Initialize SQLite and ensure table has columns for Uploadcare URL & timestamp
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
cursor = conn.cursor()
cursor.execute("""
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    filename TEXT,
    vector_path TEXT,
    uploadcare_url TEXT,
    upload_time TEXT
)
""")
conn.commit()

# In‑memory cache of FAISS indices
db_index = {}

class AskRequest(BaseModel):
    doc_id: str
    question: str

default_example = {
    "doc_id": "64ec22b5-2237-4c9c-9599-afa3af788b57",
    "question": "Tell me all past education background of Aman Tomar based on this PDF"
}

async def extract_text(contents: bytes) -> str:
    reader = PyPDF2.PdfReader(io.BytesIO(contents))
    return "\n".join(page.extract_text() or "" for page in reader.pages)

@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(400, 'Only PDFs allowed')
    data = await file.read()
    text = await extract_text(data)

    # 1) Save PDF locally
    doc_id = str(uuid.uuid4())
    pdf_path = os.path.join(PDF_STORAGE, f"{doc_id}.pdf")
    with open(pdf_path, 'wb') as f:
        f.write(data)

    # 2) Upload to Uploadcare via direct Upload API
    files = {'file': (file.filename, open(pdf_path, 'rb'), 'application/pdf')}
    payload = {
        'UPLOADCARE_PUB_KEY': UPLOADCARE_PUBLIC_KEY,
        'UPLOADCARE_STORE': 'auto'
    }
    resp = requests.post("https://upload.uploadcare.com/base/", data=payload, files=files)
    resp.raise_for_status()
    result = resp.json()
    # the API returns { "<orig_name>": "<uuid>" }
    uuid_str = result["file"]
    uploadcare_url = f"https://ucarecdn.com/{uuid_str}/"

    # 3) Split & embed text as before
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    docs = splitter.create_documents([text])
    embed_model = HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')
    store = FAISS.from_documents(docs, embed_model)
    vector_dir = os.path.join(PDF_STORAGE, f"{doc_id}_faiss")
    store.save_local(vector_dir)

    # 4) Record metadata (including uploadcare_url & timestamp)
    now = datetime.utcnow().isoformat()
    cursor.execute(
        'INSERT INTO documents (id, filename, vector_path, uploadcare_url, upload_time) VALUES (?, ?, ?, ?, ?)',
        (doc_id, file.filename, vector_dir, uploadcare_url, now)
    )
    conn.commit()
    db_index[doc_id] = store

    return {"doc_id": doc_id, "filename": file.filename, "uploadcare_url": uploadcare_url, "upload_time": now}


# Helper: call Gemini RAG
def call_gemini_rag(question: str, context: str, history: list) -> str:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {'Content-Type': 'application/json'}
    # Build conversation as `contents`
    conversation = []
    # System instructions as first user part
    conversation.append({'role': 'user', 'parts': [{'text': 'Use the context to answer the question.'}]})
    # Context
    conversation.append({'role': 'user', 'parts': [{'text': f'Context:\n{context}'}]})
    # Chat history turns
    for turn in history[-6:]:
        conversation.append({'role': 'user', 'parts': [{'text': turn}]})
    # Current question
    conversation.append({'role': 'user', 'parts': [{'text': f'Question:\n{question}'}]})

    payload = {'contents': conversation}
    res = requests.post(url, headers=headers, json=payload)
    if res.status_code != 200:
        raise HTTPException(500, f"Gemini API error {res.status_code}: {res.text}")
    try:
        return res.json()['candidates'][0]['content']['parts'][0]['text']
    except Exception:
        raise HTTPException(500, 'Malformed Gemini response')

@app.post("/ask/", summary="Ask a question via JSON body", response_model=Optional[dict])
async def ask_json(body: AskRequest = Body(..., example=default_example)):
    # Delegate to same logic as query style
    doc_id = body.doc_id
    question = body.question
    # Load or reload FAISS store
    if doc_id not in db_index:
        cursor.execute('SELECT vector_path FROM documents WHERE id=?', (doc_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(404, 'Document not found')
        store = FAISS.load_local(
            row[0],
            HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2'),
            allow_dangerous_deserialization=True
        )
        db_index[doc_id] = store
    else:
        store = db_index[doc_id]

    docs = store.similarity_search(question, k=4)
    context = "\n\n".join([d.page_content for d in docs])

    if 'history' not in globals():
        globals()['history'] = []
    history = globals()['history']

    answer = call_gemini_rag(question, context, history)
    history.append(question)
    history.append(answer)

    return {"doc_id": doc_id, "question": question, "answer": answer}

# Retain original query-param style for backward compatibility
@app.post("/ask/", include_in_schema=False)
async def ask_query(doc_id: str, question: str):
    return await ask_json(AskRequest(doc_id=doc_id, question=question))

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000, reload=True)
