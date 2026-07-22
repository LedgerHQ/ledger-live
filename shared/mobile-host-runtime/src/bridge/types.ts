import type { ComponentType, ReactNode } from "react";

export type RemoteFallback = ComponentType<{ error: Error }>;

export interface RemoteComponentConfig<P> {
  loader: () => Promise<{ default: ComponentType<P> }>;
  loading?: ReactNode;
  fallback?: RemoteFallback;
}
