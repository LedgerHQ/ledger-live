import type { ComponentType, ReactNode } from "react";

/**
 * Rendered by {@link createRemoteComponent} when the lazily-loaded remote fails to load or
 * render (dev server down, bundle fetch failure, shared-dependency version mismatch, runtime
 * error in the remote). `retry` clears the error boundary so the remote is attempted again.
 */
export type RemoteFallback = ComponentType<{ error: Error; retry: () => void }>;

/**
 * Shared config for the React Native "bridge" helpers. Mirrors the ergonomics of
 * `@module-federation/bridge-react` (`loader` / `loading` / `fallback`) but renders with
 * React Native primitives instead of `react-dom` — the bridge-react library is DOM-only
 * (`createRoot` + `HTMLElement`) and cannot run under Hermes.
 */
export interface RemoteComponentConfig<P> {
  /** Dynamic import of the module to render. Its `default` export is the component. */
  loader: () => Promise<{ default: ComponentType<P> }>;
  /** Shown while the module loads. Defaults to `null`. */
  loading?: ReactNode;
  /** Shown when loading/rendering fails. Defaults to rendering `null`. */
  fallback?: RemoteFallback;
}
