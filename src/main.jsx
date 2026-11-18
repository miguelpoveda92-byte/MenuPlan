import React from 'react';
import ReactDOM from 'react-dom/client';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import App from './App.jsx';
import './index.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
if (typeof window !== 'undefined') {
  window.pdfjsLib = pdfjsLib;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
