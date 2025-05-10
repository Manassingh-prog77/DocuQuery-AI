// src/components/Chat.tsx

import React, { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useAppSelector } from "../../redux/hooks"; // adjust path if needed
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import SendIcon from "@mui/icons-material/Send";
import ReactMarkdown from "react-markdown";

type Message = {
  sender: "user" | "system";
  text: string;
};

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Grab the current docId from Redux
  const docId = useAppSelector((state) => state.document.docId);

  // Scroll to bottom on new messages
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send user message and, if docId exists, query backend
  const sendMessage = async () => {
    const question = input.trim();
    if (!question) return;

    // 1) append user message
    setMessages((prev) => [...prev, { sender: "user", text: question }]);
    setInput("");

    // 2) if no docId, short-circuit with a warning
    if (!docId) {
      setMessages((prev) => [
        ...prev,
        { sender: "system", text: "Please upload a PDF first." },
      ]);
      return;
    }

    // 3) call your /ask/ API
    try {
      const res = await fetch("http://127.0.0.1:8000/ask/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc_id: docId, question }),
      });

      if (!res.ok) throw new Error(res.statusText);
      const data: { answer: string } = await res.json();

      // 4) append system answer
      setMessages((prev) => [
        ...prev,
        { sender: "system", text: data.answer.trim() },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        { sender: "system", text: `Error: ${msg}` },
      ]);
      console.error(err);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  return (
     <Box sx={{ px: { lg: 12, xs: 2 } }}>
      {/* Chat messages */}
      <Box
        sx={{
          mt: "100px",
          mb: "72px",
          height: "calc(100vh - 100px - 72px)",
          overflowY: "auto",
          p: 2,
          bgcolor: "white",
        }}
      >
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{ display: "flex", alignItems: "flex-start", mb: 4 }}
          >
            <Avatar
              src={msg.sender === "user" ? "/user.svg" : "/Logo.svg"}
              alt={msg.sender}
              sx={{ width: 32, height: 32, mr: 1 }}
            />
            <Box sx={{ flex: 1 }}>
              {msg.sender === "system" ? (
                <ReactMarkdown
                  components={{
                    p: ({  ...props }) => (
                      <Typography
                        variant="body2"
                        paragraph
                        sx={{ whiteSpace: "pre-wrap" }}
                        {...props}
                      />
                    ),
                    strong: ({  ...props }) => (
                      <Typography
                        component="strong"
                        sx={{ fontWeight: 700 }}
                        {...props}
                      />
                    ),
                    li: ({  ...props }) => (
                      <li>
                        <Typography
                          variant="body2"
                          component="span"
                          {...props}
                        />
                      </li>
                    ),
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              ) : (
                <Typography variant="body1" sx={{ lineHeight: 1.4 }}>
                  {msg.text}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
        <div ref={endRef} />
      </Box>

      {/* Input bar */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          void sendMessage();
        }}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: "#fff",
          p: 4,
          px: { lg: 12, xs: 2 },
        }}
      >
        <TextField
          fullWidth
          placeholder="Send a message..."
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              backgroundColor: "#F6F7F9",
              "& fieldset": { borderColor: "transparent" },
              "&:hover fieldset": { borderColor: "#E4E8EE" },
              "&.Mui-focused fieldset": { borderColor: "#E4E8EE" },
            },
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            endAdornment: (
              <IconButton onClick={() => void sendMessage()} edge="end" sx={{ mr: 1 }}>
                <SendIcon />
              </IconButton>
            ),
          }}
        />
      </Box>
    </Box>
  );
};

export default Chat;
