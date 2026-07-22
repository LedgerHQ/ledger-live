import React from "react";

import type { RemoteFallback } from "./types";

interface RemoteErrorBoundaryProps {
  fallback?: RemoteFallback;
  children: React.ReactNode;
}

interface RemoteErrorBoundaryState {
  error: Error | null;
}

export class RemoteErrorBoundary extends React.Component<
  RemoteErrorBoundaryProps,
  RemoteErrorBoundaryState
> {
  state: RemoteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RemoteErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.warn("[mobile-host-runtime] federated remote failed to render", error, info);
  }

  render(): React.ReactNode {
    const { error } = this.state;
    const { fallback: Fallback, children } = this.props;

    if (error) {
      return Fallback ? <Fallback error={error} /> : null;
    }
    return children;
  }
}
