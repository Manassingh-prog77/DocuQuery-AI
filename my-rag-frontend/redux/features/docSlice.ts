// src/features/docSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface DocState {
  docId: string | null;
  docDetails: {
    filename?: string;
    uploadcare_url?: string;
    upload_time?: string;
  } | null;
}

const initialState: DocState = {
  docId: null,
  docDetails: null,
};

const docSlice = createSlice({
  name: 'document',
  initialState,
  reducers: {
    // Clear previous document state
    clearDoc: (state) => {
      state.docId = null;
      state.docDetails = null;
    },
    setDocDetails: (
      state,
      action: PayloadAction<{
        doc_id: string;
        filename: string;
        uploadcare_url: string;
        upload_time: string;
      }>
    ) => {
      state.docId = action.payload.doc_id;
      state.docDetails = {
        filename: action.payload.filename,
        uploadcare_url: action.payload.uploadcare_url,
        upload_time: action.payload.upload_time,
      };
    },
    updateDocDetails: (
      state,
      action: PayloadAction<Partial<DocState['docDetails']>>
    ) => {
      if (state.docDetails) {
        state.docDetails = {
          ...state.docDetails,
          ...action.payload,
        };
      }
    },
  },
});

export const { clearDoc, setDocDetails, updateDocDetails } = docSlice.actions;
export default docSlice.reducer;
