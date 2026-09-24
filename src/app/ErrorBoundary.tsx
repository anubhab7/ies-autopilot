import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useRouteError } from 'react-router-dom';
import { useDemo } from '@/store/demoStore';

function ErrorScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-6">
      <div className="max-w-md rounded-panel border border-hairline bg-surface p-6" role="alert">
        <h1 className="text-xl font-strong">Something went wrong on this screen</h1>
        <p className="mt-2 text-sm text-muted">
          The demo hit an unexpected error. Reload the page to try again, or reset the demo to go back to
          the starting data.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="h-10 rounded-chip border border-action bg-action px-4 text-sm font-medium text-bg"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
          <button
            type="button"
            className="h-10 rounded-chip border border-hairline bg-raised px-4 text-sm font-medium text-text"
            onClick={() => {
              useDemo.getState().resetDemo();
              window.location.assign('/');
            }}
          >
            Reset demo
          </button>
        </div>
      </div>
    </div>
  );
}

/** Router-level error element. */
export function RouteErrorBoundary() {
  useRouteError();
  return <ErrorScreen />;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surfaced for debugging; the friendly screen is what the viewer sees.
    console.warn('IES Autopilot error boundary', error, info.componentStack);
  }

  render() {
    return this.state.hasError ? <ErrorScreen /> : this.props.children;
  }
}
