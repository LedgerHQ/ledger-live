import React, { Suspense } from "react";

import { RemoteErrorBoundary } from "./RemoteErrorBoundary";
import type { RemoteComponentConfig } from "./types";

export function createRemoteComponent<P extends object>(
  config: RemoteComponentConfig<P>,
): React.FC<P> {
  const { loader, loading = null, fallback } = config;
  const Lazy = React.lazy(loader);

  const RemoteComponent: React.FC<P> = props => (
    <RemoteErrorBoundary fallback={fallback}>
      <Suspense fallback={loading}>
        <Lazy {...props} />
      </Suspense>
    </RemoteErrorBoundary>
  );

  RemoteComponent.displayName = "RemoteComponent";
  return RemoteComponent;
}
