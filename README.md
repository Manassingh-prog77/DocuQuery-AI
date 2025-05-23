# DocuQuery AI

##  Project Overview

DocuQuery AI is a full-stack web application designed to allow users to upload PDF documents and interact with their content by asking natural language questions. The application leverages modern web technologies and Natural Language Processing (NLP) techniques to provide intelligent answers based on the document's text.

This project was developed as part of a Fullstack Engineer Internship Assignment, demonstrating proficiency in building end-to-end applications involving file handling, database interaction, backend APIs, frontend user interfaces, and integration with NLP/LLM frameworks.

##  Features

*   **PDF Upload:** Securely upload PDF documents.
*   **Text Extraction:** Automatically extract text content from uploaded PDFs.
*   **Intelligent Q&A:** Ask questions about the content of an uploaded PDF.
*   **Contextual Answers:** Receive answers generated by an AI model based on the relevant sections of the PDF.
*   **Vector Embeddings:** Process document text into searchable vector representations using HuggingFace Embeddings.
*   **Vector Store:** Utilize a FAISS index for efficient similarity search to retrieve relevant document chunks based on user queries (Retrieval Augmented Generation - RAG).
*   **LLM Integration:** Integrate with the Google Gemini API (specifically `gemini-2.0-flash`) for generating coherent and contextually relevant answers.
*   **Metadata Storage:** Store essential document information (filename, unique ID, storage URL, upload time) in a SQLite database.
*   **Persistent Storage:** Store uploaded PDFs externally using Uploadcare for reliable access.
*   **Intuitive UI:** A clean and user-friendly interface built with React.

##  Technologies Used

**Backend:**

*   **Framework:** FastAPI (Python)
*   **NLP/LLM:**
    *   LangChain / LlamaIndex concepts (FAISS for vector store, HuggingFaceEmbeddings)
    *   Google Gemini API (`gemini-2.0-flash`)
*   **PDF Processing:** PyPDF2
*   **Database:** SQLite
*   **File Storage:** Local filesystem (temporary), Uploadcare (external persistent)
*   **Dependencies:** `requests`, `python-dotenv`, `uvicorn`, `pydantic`, etc.

**Frontend:**

*   **Framework:** React.js (with TypeScript)
*   **State Management:** Redux Toolkit
*   **Build Tool:** Vite
*   **Styling:** Material UI.
*   **Dependencies:** `react`, `react-dom`, `react-redux`, `@reduxjs/toolkit`, etc.

##  Setup and Installation

Follow these steps to get the application running on your local machine.

### Prerequisites

*   **Python 3.8+**
*   **Node.js & npm/yarn**
*   **Git**

### 1. Clone the Repository

```bash
git clone <repository_url> # Replace with the actual URL of your repository
cd <repository_directory>


Assume the project structure has a backend directory for FastAPI code and a frontend directory for React code.

Example navigation

cd my-rag-frontend

Backend Setup

Navigate into the backend directory:

cd backend

Create and activate a Python Virtual Environment:

For Linux/macOS

python3 -m venv venv
source venv/bin/activate

For Windows

python -m venv venv
.\venv\Scripts\activate

Install Dependencies:

You need to create a requirements.txt file in the backend directory. Based on the provided app.py, the dependencies are:

fastapi==0.111.0
uvicorn[standard]==0.29.0
pydantic==2.7.1
requests==2.32.3
PyPDF2==3.0.1
python-dotenv==1.0.0
langchain==0.2.1
langchain-community==0.2.1
sentence-transformers==2.7.0
faiss-cpu==1.8.0

Now install the dependencies:

pip install -r requirements.txt

Configuration:

The application requires API keys for Uploadcare and Google Gemini.

Uploadcare: Your current code hardcodes these keys (UPLOADCARE_PUBLIC_KEY and UPLOADCARE_SECRET_KEY). For production or sharing, it's highly recommended to use environment variables. You could create a .env file in the backend directory like this:

UPLOADCARE_PUBLIC_KEY="your_uploadcare_public_key"
UPLOADCARE_SECRET_KEY="your_uploadcare_secret_key"
GEMINI_API_KEY="your_google_gemini_api_key"

And modify app.py to load them:

Before load_dotenv()
import os
from dotenv import load_dotenv
load_dotenv()
UPLOADCARE_PUBLIC_KEY = os.getenv("UPLOADCARE_PUBLIC_KEY")
UPLOADCARE_SECRET_KEY = os.getenv("UPLOADCARE_SECRET_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

However, your current code hardcodes them. So, for the current state, ensure UPLOADCARE_PUBLIC_KEY, UPLOADCARE_SECRET_KEY, and GEMINI_API_KEY are correctly set within the app.py file itself, or update the code to use .env and provide a .env.example.

Database: A SQLite database file (my_docs_store.db) will be automatically created in the backend directory the first time the application runs if it doesn't exist.

PDF Storage: A local directory (pdfs/) will also be created to temporarily store PDFs before uploading to Uploadcare and to store the FAISS vector indices.

Frontend Setup

Navigate into the frontend directory:

cd my-rag-frontend

Install Dependencies:

npm install

Configuration:

Running the Application

Ensure you have completed the setup steps for both backend and frontend.

Start the Backend Server

Open a terminal, navigate to the backend directory, activate the virtual environment, and run:

cd backend

The backend server will start, typically at http://127.0.0.1:8000.

Start the Frontend Development Server

Open a new terminal, navigate to the frontend directory, and run:

cd frontend
npm run dev

The frontend development server will start. Vite usually serves it on http://localhost:5173 or another available port.

Access the Application

Open your web browser and go to the address where the frontend is served (e.g., http://localhost:5173).

Application Architecture

The application follows a standard client-server architecture with a focus on microservices-like components for specific tasks (like vector search and LLM interaction).

Frontend (React):

User Interface for interacting with the application.

Handles user actions (file selection, button clicks, text input).

Manages application state (current document, loading states, questions/answers) using Redux Toolkit.

Communicates with the Backend API via HTTP requests.

Backend (FastAPI):

Acts as the API layer and orchestrator.

/upload/ Endpoint:

Receives PDF file uploads.

Performs initial validation (file type).

Saves the file temporarily to the local pdfs/ directory.

Uploads the PDF to Uploadcare for persistent cloud storage.

Extracts text from the PDF using PyPDF2.

Chunks the extracted text using RecursiveCharacterTextSplitter.

Generates vector embeddings for the text chunks using HuggingFaceEmbeddings.

Creates a FAISS index from the embeddings and chunks.

Saves the FAISS index to the local pdfs/ directory.

Stores document metadata (ID, filename, local vector path, Uploadcare URL, timestamp) in the SQLite database (my_docs_store.db).

Caches the FAISS index in memory (db_index) for faster access.

Returns document metadata including a unique doc_id.

/ask/ Endpoint:

Receives a doc_id and a question via a JSON body.

Retrieves the vector_path for the given doc_id from the SQLite database if the FAISS index is not already cached.

Loads the FAISS index from the specified path.

Performs a similarity search on the FAISS index using the user's question to find relevant text chunks (context).

Prepares a prompt for the LLM including the relevant context and the user's question. Note: The current implementation maintains a global, in-memory history which is not ideal for multiple concurrent users or persistent sessions. This should be noted as an area for improvement.

Calls the Google Gemini API (gemini-2.0-flash) with the prompt.

Parses the response from the Gemini API.

Returns the generated answer to the frontend.

Database (SQLite): Stores metadata about uploaded documents, mapping a unique doc_id to its filename, local vector index path, Uploadcare URL, and upload time.

Vector Store (FAISS): Stores the vector representations of the document text chunks, enabling fast semantic search. Indices are saved locally and cached in memory.

External Storage (Uploadcare): Provides a reliable and publicly accessible URL for the original uploaded PDF files.

LLM (Google Gemini): Provides the generative AI capability to read the context and formulate an answer to the user's question.

graph TD
A[User Browser - React Frontend] -->|HTTP Requests| B(FastAPI Backend)
B -->|File Data| C{Uploadcare}
B -->|Embeddings/Index Data| D[Local Filesystem - FAISS Indices]
B -->|Metadata (doc_id, path, url, time)| E[SQLite Database - my_docs_store.db]
B -->|API Call (Question + Context)| F(Google Gemini API)
F -->|Answer| B
B -->|JSON Response (doc_id, answer, etc.)| A

Backend API Documentation

The FastAPI backend exposes the following endpoints:

POST /upload/

Description: Uploads a PDF document, processes it, and stores its metadata and vector index.

Request: multipart/form-data containing a single file field named file.

Field: file (type: UploadFile) - The PDF file to upload.

Response: application/json

Success (200 OK):

{
"doc_id": "string", // Unique ID assigned to the document
"filename": "string", // Original name of the uploaded file
"uploadcare_url": "string", // URL where the PDF is stored on Uploadcare
"upload_time": "string" // ISO format timestamp of the upload
}

Error (400 Bad Request): If the uploaded file is not a PDF.

Error (500 Internal Server Error): If processing fails (e.g., Uploadcare error, text extraction issue, embedding error).

POST /ask/

Description: Receives a question related to a previously uploaded document and returns an AI-generated answer.

Request: application/json

Body:

{
"doc_id": "string", // The unique ID of the document to ask about (obtained from /upload/)
"question": "string" // The question about the document's content
}

Example Request Body:

{
"doc_id": "64ec22b5-2237-4c9c-9599-afa3af788b57",
"question": "What is the main topic of this document?"
}

Response: application/json

Success (200 OK):

{
"doc_id": "string", // The ID of the document queried
"question": "string", // The question asked
"answer": "string" // The AI-generated answer based on the document context
}

Error (404 Not Found): If the provided doc_id does not exist in the database.

Error (422 Unprocessable Entity): If the request body format is incorrect (due to Pydantic validation).

Error (500 Internal Server Error): If processing fails (e.g., FAISS loading error, Gemini API error, malformed Gemini response).

Note: The endpoint also supports a query parameter style (/ask/?doc_id=...&question=...) but the JSON body approach is the primary documented method.

Frontend Details

The frontend is built using React with TypeScript and Redux Toolkit for state management.

State: The Redux store manages the currently selected document's ID (docId) and its details (docDetails), including filename, Uploadcare URL, and upload time. This allows different components to access information about the document being viewed or queried.

Components: Key components would include:

A file input component for uploading PDFs.

A document display area (potentially showing metadata or a preview link).

A question input field and a button to trigger the query.

An area to display the answers, potentially showing a history of the conversation with the document.

Workflow:

User lands on the page.

User uses the file input to select and upload a PDF via the /upload/ endpoint.

Upon successful upload, the backend returns the document details, which are stored in the Redux state (docId, docDetails).

The UI updates to show the uploaded document details and presents the question input area.

User types a question and submits it. The frontend sends a request to the /ask/ endpoint using the stored docId and the question.

Upon receiving the answer from the backend, the frontend displays it to the user.

The user can then ask follow-up questions using the same input field, which triggers another call to the /ask/ endpoint with the same docId.

 License

This project is licensed under the MIT License. See the LICENSE file for details. (You should include an actual LICENSE file in your repository).
