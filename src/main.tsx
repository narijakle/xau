import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Guard against benign browser ResizeObserver notification loop events
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message &&
      (event.message.includes('ResizeObserver loop completed with undelivered notifications') ||
        event.message.includes('ResizeObserver loop limit exceeded'))
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

