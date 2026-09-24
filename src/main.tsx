import '@fontsource-variable/instrument-sans';
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from './app/ErrorBoundary';
import { router } from './app/router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </ErrorBoundary>
  </StrictMode>,
);
