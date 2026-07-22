import React, { Suspense } from "react";

import { RemoteErrorBoundary } from "./RemoteErrorBoundary";
import type { RemoteComponentConfig } from "./types";

export function createRemoteComponent<P extends object>(
  config: RemoteComponentConfig<P>,
): React.FC<P> {
  const { loader, loading = null, fallback: Fallback } = config;

  const Lazy = React.lazy<React.ComponentType<P>>(async () => {
    try {
      const mod = await loader();
      if (!mod || !mod.default) {
        throw new Error("resolved without a default export");
      }
      return mod;
    } catch (error) {
      console.warn("[mobile-host-runtime] federated remote failed to load", error);
      const err = error instanceof Error ? error : new Error(String(error));
      const RemoteUnavailable: React.ComponentType<P> = () =>
        Fallback ? <Fallback error={err} /> : null;
      RemoteUnavailable.displayName = "RemoteUnavailable";
      return { default: RemoteUnavailable };
    }
  });

  const RemoteComponent: React.FC<P> = props => (
    <RemoteErrorBoundary fallback={Fallback}>
      <Suspense fallback={loading}>
        <Lazy {...props} />
      </Suspense>
    </RemoteErrorBoundary>
  );

  RemoteComponent.displayName = "RemoteComponent";
  return RemoteComponent;
}
