// Collaborators of `createFeatureFlagsMiddleware`. Not reachable from the package barrel, so they
// can be unit-tested without widening the public API. Public types are declared by `../middleware`
// and imported here rather than re-exported.
import { type Action } from "@reduxjs/toolkit";
import type { PartialFeatures, ResolutionConfig } from "../schema";
import type { FeatureFlagsReadFailure, FeatureFlagsReadStage } from "../middleware";
import { FEATURE_FLAGS_REMOTE_POLLING_INTERVAL_MS } from "../../constants";
import { syncRemoteConfig, setRemoteFlagsReady } from "../slice";

/**
 * Mutable single-slot container for the latest remote flags. Modeled after a
 * React ref: the middleware reads `current` on every action dispatch, while
 * {@link pollRemoteFlags} and {@link primeFromCache} write to it.
 */
export type RemoteFlagsRef = {
  current: PartialFeatures;
};

/** Minimal shape of the store dispatch these collaborators need. */
type Dispatch = (action: ReturnType<typeof syncRemoteConfig | typeof setRemoteFlagsReady>) => void;

/** Re-resolves the slice. `didFetch` distinguishes a successful read from a first failed settle. */
type DispatchSync = (didFetch: boolean) => void;

/** Arms the boot-readiness gate. */
type DispatchReady = () => void;

/** Reports a failed read. Observation only, it never affects resolution. */
type ReportError = (error: unknown, stage: FeatureFlagsReadStage, attempt: number) => void;

/** Where a flag read publishes what it found: the slot it writes, and how it signals and reports. */
export type ReadContext = {
  ref: RemoteFlagsRef;
  dispatchSync: DispatchSync;
  dispatchReady: DispatchReady;
  reportError: ReportError;
};

/** Everything {@link pollRemoteFlags} needs, as one object so the self-reschedule stays readable. */
export type PollContext = ReadContext & {
  fetch: () => Promise<PartialFeatures>;
  /** Delay between iterations. Defaults to {@link FEATURE_FLAGS_REMOTE_POLLING_INTERVAL_MS}. */
  ms?: number;
};

/**
 * Builds the two one-shot dispatchers that drive re-resolution and the boot gate.
 *
 * `dispatchSync` re-resolves on every successful read, and once on the first settle even when it
 * failed, so env and default resolution still runs at boot. `dispatchReady` arms the gate at most
 * once; the reducer is idempotent regardless.
 */
export function createDispatchers(dispatch: Dispatch): {
  dispatchSync: DispatchSync;
  dispatchReady: DispatchReady;
} {
  let initialSyncDone = false;
  let readyDispatched = false;

  return {
    dispatchSync: (didFetch: boolean) => {
      if (didFetch || !initialSyncDone) {
        initialSyncDone = true;
        dispatch(syncRemoteConfig());
      }
    },
    dispatchReady: () => {
      if (readyDispatched) return;
      readyDispatched = true;
      dispatch(setRemoteFlagsReady());
    },
  };
}

/**
 * Wraps the consumer's failure reporter so it can never affect resolution. `isCold` is computed
 * from the ref at the moment of the failure, and a handler that throws is swallowed rather than
 * allowed to kill the poll loop.
 */
export function createErrorReporter(
  onRemoteFlagsError: ((error: unknown, failure: FeatureFlagsReadFailure) => void) | undefined,
  ref: RemoteFlagsRef,
): ReportError {
  return (error, stage, attempt) => {
    if (!onRemoteFlagsError) return;
    try {
      onRemoteFlagsError(error, {
        stage,
        attempt,
        isCold: Object.keys(ref.current).length === 0,
      });
    } catch {
      // A reporter is never allowed to break flag resolution or kill the poll loop.
    }
  };
}

/**
 * Primes the remote-flag cache from the device's own storage, with no network access.
 *
 * An empty result is treated as "no cache" and leaves both the ref and the gate untouched, so a
 * first-ever install never arms readiness on compiled defaults. A failing read is reported and
 * otherwise ignored: an unreadable cache is not an error, just nothing to prime from.
 */
export async function primeFromCache(
  readCachedFlags: () => Promise<PartialFeatures>,
  { ref, dispatchSync, dispatchReady, reportError }: ReadContext,
): Promise<void> {
  try {
    const cached = await readCachedFlags();
    if (Object.keys(cached).length > 0) {
      ref.current = cached;
      dispatchSync(true);
      dispatchReady();
    }
  } catch (error) {
    reportError(error, "cache", 1);
  }
}

/**
 * Self-rescheduling poll loop: fetches remote flags, writes them to the ref on success,
 * dispatches the update, signals readiness, then schedules the next iteration. A failed fetch is
 * reported, leaves the ref untouched, and still re-schedules so transient errors don't kill the
 * loop.
 *
 * @param attempt
 * 1-based index of this iteration, passed to `reportError` so a consumer can tell a boot failure
 * from a routine poll failure.
 */
export async function pollRemoteFlags(context: PollContext, attempt: number = 1): Promise<void> {
  const { fetch, ref, dispatchSync, dispatchReady, reportError } = context;
  const ms = context.ms ?? FEATURE_FLAGS_REMOTE_POLLING_INTERVAL_MS;

  const remote = await fetch().catch(error => {
    reportError(error, "remote", attempt);
    return null;
  });
  if (remote !== null) {
    ref.current = remote;
  }
  dispatchSync(remote !== null);
  dispatchReady();
  setTimeout(pollRemoteFlags, ms, context, attempt + 1);
}

/**
 * Runs the cache prime, then hands over to the poll loop.
 *
 * Sequenced, never raced: awaiting the prime before starting the network means a slow storage
 * read can never land on top of a fresher fetch result. The poll is skipped entirely when no
 * fetcher was configured.
 */
export async function primeThenPoll(
  readCachedFlags: () => Promise<PartialFeatures>,
  context: ReadContext,
  fetch: (() => Promise<PartialFeatures>) | undefined,
  ms: number | undefined,
): Promise<void> {
  await primeFromCache(readCachedFlags, context);
  if (fetch) await pollRemoteFlags({ ...context, fetch, ms });
}

/**
 * Tracks the app language so the middleware can re-resolve when it changes, keeping the mutable
 * "last seen" value out of the middleware closure.
 *
 * `read` returns `undefined` when no selector was configured.
 */
export function createLanguageWatcher<S>(
  getAppLanguage: ((state: S) => string) | undefined,
  getState: () => S,
  dispatch: Dispatch,
): { read: () => string | undefined; checkChange: () => void } {
  const read = () => getAppLanguage?.(getState());
  let lastLang = read();

  return {
    read,
    checkChange: () => {
      // Resolution is event-driven, so a language change has to be pushed explicitly.
      if (!getAppLanguage) return;
      const lang = read();
      if (lang !== lastLang) {
        lastLang = lang;
        dispatch(syncRemoteConfig());
      }
    },
  };
}

/**
 * Rebuilds a `featureFlags/*` action with the resolution context and the latest remote flags
 * attached, so reducers re-resolve from action data rather than from a global singleton.
 *
 * `appLanguage` is only folded into `resolutionConfig` when a language selector was configured,
 * matching the untouched config object the reducers would otherwise receive.
 */
export function buildFeatureFlagsMeta(
  action: Action<string>,
  resolutionConfig: ResolutionConfig,
  appLanguage: string | undefined,
  hasLanguageSelector: boolean,
  remoteFlags: PartialFeatures,
) {
  return {
    ...action,
    meta: {
      ...getMeta(action),
      resolutionConfig: hasLanguageSelector
        ? { ...resolutionConfig, appLanguage }
        : resolutionConfig,
      remoteFlags,
    },
  };
}

/**
 * Extracts any existing `meta` from an action so it can be preserved when the middleware spreads
 * its own meta on top. `Action<string>` does not carry a `meta` field in its type, so the presence
 * check is done at runtime.
 */
function getMeta(action: Action<string>) {
  return "meta" in action && typeof action.meta === "object" && action.meta !== null
    ? action.meta
    : {};
}
