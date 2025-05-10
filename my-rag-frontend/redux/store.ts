// src/store.ts
import { configureStore } from '@reduxjs/toolkit';
import docReducer from './features/docSlice';

export const store = configureStore({
  reducer: {
    document: docReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
