import { type Action, type Middleware, isAction } from "@reduxjs/toolkit";
import type { PartialFeatures, ResolutionConfig } from "./schema";
import { FEATURE_FLAGS_REMOTE_POLLING_INTERVAL_MS } from "../constants";
import { syncRemoteConfig, setRemoteFlagsReady } from "./slice";

/** Feature-flags metadata that the middleware injects into every `featureFlags/*` action. */
export interface FeatureFlagsMeta {
  resolutionConfig: ResolutionConfig;
  remoteFlags: PartialFeatures;
}

/** Configuration for {@link createFeatureFlagsMiddleware}, bound at store creation. */
export interface FeatureFlagsMiddlewareConfig<S = unknown> {
  /** Static context used by reducers to resolve flags (platform, version, env overrides). */
  resolutionConfig: ResolutionConfig;
  /**
   * Optional async callback that returns the latest remote feature flags. When
   * provided, the middleware fires it once on creation and on every
   * `refreshInterval` tick, caching the result in a closure for injection into
   * `action.meta.remoteFlags`.
   */
  fetchRemoteFlags?: () => Promise<PartialFeatures>;
  /** Polling interval for `fetchRemoteFlags`. Defaults to {@link FEATURE_FLAGS_REMOTE_POLLING_INTERVAL_MS}. */
  refreshInterval?: number;
  /** Optional selector for the current app language, injected into resolution and re-resolved on change. */
  getAppLanguage?: (state: S) => string;
}

/**
 * Creates a Redux middleware that owns remote-flag fetching and injects
 * `resolutionConfig` + `remoteFlags` into the meta of every `featureFlags/*`
 * action, so reducers can re-resolve from action data instead of pulling from
 * a global singleton or persisted state.
 *
 * Remote flags are transient — held in a closure-private cache that is rebuilt
 * on each fetch and never persisted. Before the first fetch resolves, the cache
 * is `{}` and resolution falls back to local overrides + env + defaults.
 *
 * @param config
 * Resolution context plus optional fetcher + interval. Bound at store creation.
 */
export function createFeatureFlagsMiddleware<S = unknown>(
  config: FeatureFlagsMiddlewareConfig<S>,
): Middleware<object, S> {
  const remoteFlagsRef: RemoteFlagsRef = { current: {} };
  return ({ dispatch, getState }) => {
    const { resolutionConfig, fetchRemoteFlags, refreshInterval, getAppLanguage } = config;
    const readLang = () => getAppLanguage?.(getState());
    let lastLang = readLang();
    if (fetchRemoteFlags) {
      let readyDispatched = false;
      const dispatchSync = () => dispatch(syncRemoteConfig());
      const dispatchReady = () => {
        if (readyDispatched) return;
        readyDispatched = true;
        dispatch(setRemoteFlagsReady());
      };
      void pollRemoteFlags(
        fetchRemoteFlags,
        remoteFlagsRef,
        dispatchSync,
        dispatchReady,
        refreshInterval,
      );
    }
    return next => action => {
      if (!isAction(action)) return next(action);

      if (action.type.startsWith("featureFlags/")) {
        return next({
          ...action,
          meta: {
            ...getMeta(action),
            resolutionConfig: getAppLanguage
              ? { ...resolutionConfig, appLanguage: readLang() }
              : resolutionConfig,
            remoteFlags: remoteFlagsRef.current,
          },
        });
      }

      const result = next(action);
      // Re-resolve when the language changes (resolution is event-driven).
      if (getAppLanguage) {
        const lang = readLang();
        if (lang !== lastLang) {
          lastLang = lang;
          dispatch(syncRemoteConfig());
        }
      }
      return result;
    };
  };
}

/**
 * Extracts any existing `meta` from an action so it can be preserved when the
 * middleware spreads its own meta on top. `Action<string>` does not carry a
 * `meta` field in its type, so the presence check is done at runtime.
 *
 * @param action
 * The intercepted Redux action.
 *
 * @returns
 * The existing meta object, or an empty object if absent or not an object.
 */
function getMeta(action: Action<string>) {
  return "meta" in action && typeof action.meta === "object" && action.meta !== null
    ? action.meta
    : {};
}

/**
 * Self-rescheduling poll loop: fetches remote flags, writes them to the ref on
 * success, dispatches the update, signals readiness, then schedules the next
 * iteration. A failed fetch resolves to `null` (via `.catch`), leaves the ref
 * untouched, and still re-schedules so transient errors don't kill the loop.
 *
 * @param fetch
 * Async callback that returns the latest remote flags map.
 *
 * @param ref
 * Mutable container that receives each successful fetch result. Read by the
 * middleware when injecting `action.meta.remoteFlags`.
 *
 * @param dispatchSync
 * Callback fired after each *successful* fetch — used to dispatch
 * `syncRemoteConfig()` so reducers re-resolve.
 *
 * @param dispatchReady
 * Callback fired after each *settled* fetch (resolved or rejected) — used to
 * dispatch `setRemoteFlagsReady()`. The caller guards it so only the first
 * settle propagates; idempotent on the reducer side regardless.
 *
 * @param ms
 * Delay between iterations, in milliseconds. Defaults to
 * {@link FEATURE_FLAGS_REMOTE_POLLING_INTERVAL_MS}.
 */
async function pollRemoteFlags(
  fetch: () => Promise<PartialFeatures>,
  ref: RemoteFlagsRef,
  dispatchSync: () => void,
  dispatchReady: () => void,
  ms: number = FEATURE_FLAGS_REMOTE_POLLING_INTERVAL_MS,
) {
  const remote = await fetch().catch(() => null);
  if (remote !== null) {
    ref.current = remote;
    dispatchSync();
  }
  dispatchReady();
  setTimeout(pollRemoteFlags, ms, fetch, ref, dispatchSync, dispatchReady, ms);
}

/**
 * Mutable single-slot container for the latest remote flags. Modeled after a
 * React ref: the middleware reads `current` on every action dispatch, while
 * {@link pollRemoteFlags} writes to it after each successful fetch.
 */
type RemoteFlagsRef = {
  current: PartialFeatures;
};
