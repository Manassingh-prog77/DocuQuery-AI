// src/components/Navbar.tsx

import React, { useState,useRef, type ChangeEvent } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { setDocDetails } from "../../redux/features/docSlice";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";

import AddCircleOutlineTwoToneIcon from "@mui/icons-material/AddCircleOutlineTwoTone";
import { clearDoc } from "../../redux/features/docSlice";

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const docId = useAppSelector((state) => state.document.docId);
  const docDetails = useAppSelector((state) => state.document.docDetails);

  const handleButtonClick = () => {
    dispatch(clearDoc());
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      alert("Please select a PDF file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const res = await fetch("http://127.0.0.1:8000/upload/", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);

      const data = await res.json();
      dispatch(setDocDetails(data));
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Error uploading file: ${message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

   const renderUploadButton = () => (
    <Button
      variant="outlined"
      onClick={handleButtonClick}
      disabled={uploading}
      sx={{
        border: "2px solid #000000",
        textTransform: "none",
        fontWeight: 500,
        px: 3,
        borderRadius: 2,
        color: "#000000",
      }}
    >
      {uploading ? (
        <CircularProgress size={22} sx={{ mr: 1 }} color="success" />
      ) : (
        <AddCircleOutlineTwoToneIcon sx={{ mr: 1, fontSize: "22px" }} />
      )}
      {uploading ? "Uploading..." : "Upload PDF"}
    </Button>
  );

  return (
    <AppBar
      position="fixed"
      color="default"
      elevation={4}
      sx={{
        backgroundColor: "#ffffff",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Box sx={{ px: { lg: 6, xs: 2 } }}>
        <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
          {/* Logo */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <img src="/fullLogo.svg" alt="Logo" style={{ height: 40 }} />
          </Box>

          {/* Hidden file input */}
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

           {/* Conditional PDF display or Upload button */}
          {docId && docDetails ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                }}
              >
                <img
                  src="/pdf.svg"
                  alt="PDF Icon"
                  style={{ marginRight: "8px", height: "32px", width: "32px" }}
                />
                <Link
                  href={docDetails.uploadcare_url}
                  target="_blank"
                  underline="none"
                  sx={{ fontWeight: 500, color: "#0FA958", mr: 2 }}
                >
                  {docDetails.filename}
                </Link>
              </Box>
              {renderUploadButton()}
            </Box>
          ) : (
            renderUploadButton()
          )}
        </Toolbar>
      </Box>
    </AppBar>
  );
};

export default Navbar;
