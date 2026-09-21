import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Telemetry startup diagnostics
console.log('[AegisWatch] Initializing telemetry dashboard. Mode:', import.meta.env.MODE);

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[AegisWatch] Fatal error: DOM mounting container #root not found.');
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
