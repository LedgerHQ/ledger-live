import React from "react";

import type { RemoteFallback } from "./types";

interface RemoteErrorBoundaryProps {
  fallback?: RemoteFallback;
  children: React.ReactNode;
}

interface RemoteErrorBoundaryState {
  error: Error | null;
}

/**
 * Contains failures from a lazily-loaded federated remote so a broken/unavailable remote
 * never takes down the host screen. Dependency-free (no `react-error-boundary`) so it can
 * live in this shared singleton package.
 */
export class RemoteErrorBoundary extends React.Component<
  RemoteErrorBoundaryProps,
  RemoteErrorBoundaryState
> {
  state: RemoteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RemoteErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // A remote failing to load is expected/recoverable (dev server down, network, version
    // mismatch), so warn rather than error — console.error is forwarded to Datadog/Sentry.
    console.warn("[mobile-host-runtime] federated remote failed to render", error, info);
  }

  private retry = (): void => {
    this.setState({ error: null });
  };

  render(): React.ReactNode {
    const { error } = this.state;
    const { fallback: Fallback, children } = this.props;

    if (error) {
      return Fallback ? <Fallback error={error} retry={this.retry} /> : null;
    }
    return children;
  }
}
