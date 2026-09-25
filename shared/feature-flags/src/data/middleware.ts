import { type Middleware, isAction } from "@reduxjs/toolkit";
import type { PartialFeatures, ResolutionConfig } from "./schema";
import { FEATURE_FLAGS_REMOTE_POLLING_INTERVAL_MS } from "../constants";
import {
  buildFeatureFlagsMeta,
  createDispatchers,
  createErrorReporter,
  createLanguageWatcher,
  dispatchSafely,
  pollRemoteFlags,
  primeThenPoll,
  type RemoteFlagsRef,
} from "./internals/middleware";

/** Feature-flags metadata that the middleware injects into every `featureFlags/*` action. */
export interface FeatureFlagsMeta {
  resolutionConfig: ResolutionConfig;
  remoteFlags: PartialFeatures;
}

/**
 * Which step failed, reported to {@link FeatureFlagsMiddlewareConfig.onRemoteFlagsError}: one of
 * the two reads, or the re-resolution of the slice that follows them.
 */
export type FeatureFlagsReadStage = "cache" | "remote" | "sync";

/**
 * Context for a failed feature-flag read. Observation only, it never feeds resolution.
 *
 * The three fields answer three different questions: `stage` which read failed, `isCold` whether
 * the session is degraded as a result, and `attempt` how long it has been going on. Severity comes
 * from `isCold`, not from `stage`: a failed read whose values are already in place is routine.
 *
 * The shapes that occur:
 *
 * - `cache` / attempt 1 / cold — the device's own storage could not be read at all (IndexedDB
 *   refused on desktop, native module unreachable on mobile). Not fatal, the network path still
 *   runs. This is the only shape a cache failure ever takes: the prime runs before anything can
 *   populate the map, so it is always cold, and it never retries.
 * - `remote` / attempt 1 / cold — the one that matters. The boot fetch failed and no cache was
 *   primed, so the entire session resolves on compiled defaults.
 * - `remote` / attempt 1 / warm — the boot fetch failed but the cache had already primed, so the
 *   session runs on the last values the backend sent. A connectivity signal, not a correctness one.
 * - `remote` / attempt n > 1 / cold — still nothing after n tries. Multiply by the refresh interval
 *   for how long this session has been misconfigured.
 * - `remote` / attempt n > 1 / warm — a routine poll failure with values in place. Expected on any
 *   flaky connection, and usually not worth reporting.
 * - `sync` / any attempt / cold or warm — a reducer or a downstream middleware threw while the
 *   slice was being re-resolved, so it still holds the previous values. Always a bug, never
 *   routine, whatever `isCold` says. The boot signals are armed anyway, so a startup waiting on
 *   them is not stranded.
 *
 * `cache` combined with a warm map, or with an attempt above 1, cannot happen.
 */
export interface FeatureFlagsReadFailure {
  /** The local cache prime, a network poll, or the re-resolution that follows either. */
  stage: FeatureFlagsReadStage;
  /** 1 for the boot attempt, incremented on each subsequent poll. Always 1 for `cache`. */
  attempt: number;
  /** Whether the middleware still holds no remote values at all, so resolution is on defaults. */
  isCold: boolean;
}

/** Configuration for {@link createFeatureFlagsMiddleware}, bound at store creation. */
export interface FeatureFlagsMiddlewareConfig<S = unknown> {
  /** Static context used by reducers to resolve flags (platform, version, env overrides). */
  resolutionConfig: ResolutionConfig;
  /**
   * Optional async callback returning the flags already cached on this device, read without
   * any network access. When provided, the middleware primes from it *before* the first
   * `fetchRemoteFlags`, so boot resolves on the last values the backend actually sent rather
   * than on compiled defaults.
   *
   * It changes *which values* boot resolves on, not *when* readiness is announced: that stays
   * with the first `fetchRemoteFlags` settling, so the boot gates keep the exact meaning they had
   * before the cache existed. Its own settling is exposed as `cachedFlagsSettled`, for a boot that
   * must not render before the cached values are in the slice but must not wait on the network.
   */
  readCachedFlags?: () => Promise<PartialFeatures>;
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
  /**
   * Optional reporter for a failed read, invoked once per failure. Purely observational: it
   * runs after the middleware has already decided everything, the remote-flag cache is left
   * untouched, and the return value is ignored, so a handler can never become a second source
   * of flags. A handler that throws is swallowed and does not stop the poll loop.
   */
  onRemoteFlagsError?: (error: unknown, failure: FeatureFlagsReadFailure) => void;
}

/**
 * Creates a Redux middleware that owns remote-flag fetching and injects
 * `resolutionConfig` + `remoteFlags` into the meta of every `featureFlags/*`
 * action, so reducers can re-resolve from action data instead of pulling from
 * a global singleton or persisted state.
 *
 * Remote flags are transient — held in a closure-private cache that is rebuilt
 * on each fetch and never persisted. `readCachedFlags` primes that cache from the
 * device's own storage before the first fetch, so a failed or slow network does not
 * push resolution back onto compiled defaults. Without it, and before the first fetch
 * resolves, the cache is `{}` and resolution falls back to local overrides + env + defaults.
 *
 * The body reads as: assemble the collaborators from `./internals/middleware`, pick one of the
 * two start-ups, return the middleware.
 *
 * @param config
 * Resolution context plus optional cache reader, fetcher and interval. Bound at store creation.
 */
export function createFeatureFlagsMiddleware<S = unknown>(
  config: FeatureFlagsMiddlewareConfig<S>,
): Middleware<object, S> {
  const remoteFlagsRef: RemoteFlagsRef = { current: {} };
  return ({ dispatch, getState }) => {
    const {
      resolutionConfig,
      readCachedFlags,
      fetchRemoteFlags,
      refreshInterval,
      getAppLanguage,
      onRemoteFlagsError,
    } = config;

    const language = createLanguageWatcher(getAppLanguage, getState, dispatch);
    const { dispatchSync, dispatchReady, dispatchCacheSettled } = createDispatchers(dispatch);
    const reportError = createErrorReporter(onRemoteFlagsError, remoteFlagsRef);
    const readContext = {
      ref: remoteFlagsRef,
      dispatchSync,
      dispatchReady,
      dispatchCacheSettled,
      reportError,
    };

    if (readCachedFlags) {
      void primeThenPoll(readCachedFlags, readContext, fetchRemoteFlags, refreshInterval);
    } else {
      // No cache to wait for, but still re-resolved first so env overrides and version filters
      // are in place when the signal arms. Deferred because Redux forbids dispatching while the
      // middleware chain is still being built.
      void Promise.resolve().then(() => {
        dispatchSafely(() => dispatchSync(false), reportError, 1);
        dispatchSafely(dispatchCacheSettled, reportError, 1);
      });
      if (fetchRemoteFlags) {
        // Deliberately a bare call: the middleware tests drain a fixed number of microtask turns,
        // so the no-cache path must not gain an `await` in front of the loop.
        void pollRemoteFlags({ ...readContext, fetch: fetchRemoteFlags, ms: refreshInterval });
      }
    }

    return next => action => {
      if (!isAction(action)) return next(action);

      if (action.type.startsWith("featureFlags/")) {
        return next(
          buildFeatureFlagsMeta(
            action,
            resolutionConfig,
            language.read(),
            !!getAppLanguage,
            remoteFlagsRef.current,
          ),
        );
      }

      const result = next(action);
      language.checkChange();
      return result;
    };
  };
}
