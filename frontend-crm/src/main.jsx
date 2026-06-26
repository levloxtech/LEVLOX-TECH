import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global Error Handler for Production
const logErrorToBackend = async (errorMsg, stack, url) => {
  if (import.meta.env.DEV) {
    console.error("Local CRM Error Caught:", errorMsg, stack);
    return;
  }
  const localUrl = localStorage.getItem('crm_api_url');
  const apiEndpoint = localUrl || import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
  try {
    const formattedUrl = apiEndpoint.endsWith('/api') ? apiEndpoint : apiEndpoint + '/api';
    await fetch(`${formattedUrl}/logs/frontend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: errorMsg, stack: stack, url: url })
    });
  } catch (err) {
    // Avoid infinite logging loops
  }
};

window.addEventListener('error', (event) => {
  logErrorToBackend(event.message, event.error?.stack || "", window.location.href);
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const msg = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error ? reason.stack : "";
  logErrorToBackend(`Unhandled CRM Rejection: ${msg}`, stack, window.location.href);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

