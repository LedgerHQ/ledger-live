import type { ResolutionConfig } from "../schema";
import { syncRemoteConfig, setRemoteFlagsReady, setCachedFlagsSettled } from "../slice";
import {
  buildFeatureFlagsMeta,
  createDispatchers,
  createErrorReporter,
  createLanguageWatcher,
  dispatchSafely,
  pollRemoteFlags,
  primeFromCache,
  primeThenPoll,
  type ReadContext,
  type RemoteFlagsRef,
} from "./middleware";

// The store-level suite in `../slice.test.ts` exercises the poll loop and its one-shot guards
// against a real reducer. This one pins down the ordering and the failure isolation of each
// collaborator, which a real reducer cannot be made to break on demand.

const failure = new Error("dispatch blew up");
const throwing = () => {
  throw failure;
};
function createContext(overrides: Partial<ReadContext> = {}): ReadContext {
  return {
    ref: { current: {} },
    dispatchSync: jest.fn(),
    dispatchReady: jest.fn(),
    dispatchCacheSettled: jest.fn(),
    reportError: jest.fn(),
    ...overrides,
  };
}

describe("createDispatchers", () => {
  it("re-resolves on every successful read", () => {
    const dispatch = jest.fn();
    const { dispatchSync } = createDispatchers(dispatch);

    dispatchSync(true);
    dispatchSync(true);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledWith(syncRemoteConfig());
  });

  it("re-resolves once on a first failed settle, then stays quiet", () => {
    // The boot settle has to re-resolve even on failure, so env and default resolution runs.
    // Later failures must not: the previous values are still in place.
    const dispatch = jest.fn();
    const { dispatchSync } = createDispatchers(dispatch);

    dispatchSync(false);
    dispatchSync(false);
    dispatchSync(false);

    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it("arms the boot gate at most once", () => {
    const dispatch = jest.fn();
    const { dispatchReady } = createDispatchers(dispatch);

    dispatchReady();
    dispatchReady();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(setRemoteFlagsReady());
  });

  it("marks the cache as settled at most once", () => {
    const dispatch = jest.fn();
    const { dispatchCacheSettled } = createDispatchers(dispatch);

    dispatchCacheSettled();
    dispatchCacheSettled();

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(setCachedFlagsSettled());
  });

  it("counts a throwing dispatch as done, so a failure is reported once rather than retried", () => {
    const dispatch = jest.fn(throwing);
    const { dispatchSync, dispatchReady, dispatchCacheSettled } = createDispatchers(dispatch);

    for (const run of [() => dispatchSync(false), dispatchReady, dispatchCacheSettled]) {
      expect(run).toThrow(failure);
      expect(run).not.toThrow();
    }
    expect(dispatch).toHaveBeenCalledTimes(3);
  });
});

describe("dispatchSafely", () => {
  it("runs the dispatch and reports nothing when it succeeds", () => {
    const run = jest.fn();
    const reportError = jest.fn();

    dispatchSafely(run, reportError, 1);

    expect(run).toHaveBeenCalledTimes(1);
    expect(reportError).not.toHaveBeenCalled();
  });

  it("reports a throwing dispatch as a sync failure with its attempt, without rethrowing", () => {
    const reportError = jest.fn();

    expect(() => dispatchSafely(throwing, reportError, 3)).not.toThrow();

    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(failure, "sync", 3);
  });

  it("passes a non-Error throw through unchanged", () => {
    const reportError = jest.fn();

    dispatchSafely(
      () => {
        throw "not an error";
      },
      reportError,
      1,
    );

    expect(reportError).toHaveBeenCalledWith("not an error", "sync", 1);
  });

  it("never throws once composed with the real reporter, even if the handler throws", () => {
    const reportError = createErrorReporter(throwing, { current: {} });

    expect(() => dispatchSafely(throwing, reportError, 1)).not.toThrow();
  });
});

describe("createErrorReporter", () => {
  it("does nothing when no reporter is configured", () => {
    const report = createErrorReporter(undefined, { current: {} });
    expect(() => report(new Error("boom"), "remote", 1)).not.toThrow();
  });

  it("marks the failure cold while no values are held", () => {
    const onError = jest.fn();
    const report = createErrorReporter(onError, { current: {} });

    report(new Error("boom"), "remote", 1);

    expect(onError).toHaveBeenCalledWith(expect.any(Error), {
      stage: "remote",
      attempt: 1,
      isCold: true,
    });
  });

  it("marks it warm once the ref holds values, reading the ref at call time", () => {
    const onError = jest.fn();
    const ref: RemoteFlagsRef = { current: {} };
    const report = createErrorReporter(onError, ref);

    ref.current = { mockFeature: { enabled: true } };
    report(new Error("boom"), "remote", 2);

    expect(onError).toHaveBeenCalledWith(expect.any(Error), {
      stage: "remote",
      attempt: 2,
      isCold: false,
    });
  });

  it("swallows a reporter that throws", () => {
    const report = createErrorReporter(
      () => {
        throw new Error("reporter blew up");
      },
      { current: {} },
    );

    expect(() => report(new Error("boom"), "cache", 1)).not.toThrow();
  });
});

describe("primeFromCache", () => {
  it("populates the ref and re-resolves, without arming readiness", async () => {
    // Readiness keeps its original meaning, "the first sync call has been made". The prime only
    // changes which values are resolved, never when consumers are told to look.
    const ref: RemoteFlagsRef = { current: {} };
    const dispatchSync = jest.fn();
    const dispatchReady = jest.fn();

    await primeFromCache(() => Promise.resolve({ mockFeature: { enabled: true } }), {
      ref,
      dispatchSync,
      dispatchReady,
      dispatchCacheSettled: jest.fn(),
      reportError: jest.fn(),
    });

    expect(ref.current).toEqual({ mockFeature: { enabled: true } });
    expect(dispatchSync).toHaveBeenCalledWith(true);
    expect(dispatchReady).not.toHaveBeenCalled();
  });

  it("leaves everything untouched when the cache is empty", async () => {
    const ref: RemoteFlagsRef = { current: {} };
    const dispatchSync = jest.fn();
    const dispatchReady = jest.fn();

    await primeFromCache(() => Promise.resolve({}), {
      ref,
      dispatchSync,
      dispatchReady,
      dispatchCacheSettled: jest.fn(),
      reportError: jest.fn(),
    });

    expect(ref.current).toEqual({});
    expect(dispatchSync).not.toHaveBeenCalled();
    expect(dispatchReady).not.toHaveBeenCalled();
  });

  it("reports an unreadable cache without arming anything", async () => {
    const dispatchSync = jest.fn();
    const dispatchReady = jest.fn();
    const reportError = jest.fn();

    await primeFromCache(() => Promise.reject(new Error("storage unavailable")), {
      ref: { current: {} },
      dispatchSync,
      dispatchReady,
      dispatchCacheSettled: jest.fn(),
      reportError,
    });

    expect(reportError).toHaveBeenCalledWith(expect.any(Error), "cache", 1);
    expect(dispatchSync).not.toHaveBeenCalled();
    expect(dispatchReady).not.toHaveBeenCalled();
  });

  it("reports a throwing re-resolution as a sync failure, not a cache one", async () => {
    const failure = new Error("reducer blew up");
    const reportError = jest.fn();

    await primeFromCache(() => Promise.resolve({ mockFeature: { enabled: true } }), {
      ref: { current: {} },
      dispatchSync: () => {
        throw failure;
      },
      dispatchReady: jest.fn(),
      dispatchCacheSettled: jest.fn(),
      reportError,
    });

    expect(reportError).toHaveBeenCalledTimes(1);
    expect(reportError).toHaveBeenCalledWith(failure, "sync", 1);
  });

  it("keeps the cached values in the ref when the re-resolution throws", async () => {
    // Later `featureFlags/*` actions still resolve from the ref, so the cache is not lost.
    const context = createContext({ dispatchSync: throwing });

    await primeFromCache(() => Promise.resolve({ mockFeature: { enabled: true } }), context);

    expect(context.ref.current).toEqual({ mockFeature: { enabled: true } });
  });

  it("reports a reader that throws synchronously as a cache failure", async () => {
    const context = createContext();

    await primeFromCache(() => {
      throw new Error("native module missing");
    }, context);

    expect(context.reportError).toHaveBeenCalledWith(expect.any(Error), "cache", 1);
    expect(context.dispatchSync).not.toHaveBeenCalled();
  });

  it("reports nothing for an empty cache", async () => {
    const context = createContext();

    await primeFromCache(() => Promise.resolve({}), context);

    expect(context.reportError).not.toHaveBeenCalled();
  });
});

describe("primeThenPoll", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("re-resolves, then settles the cache, then arms readiness when there is no fetcher", async () => {
    const calls: string[] = [];
    const context = createContext({
      dispatchSync: didFetch => calls.push(`sync:${didFetch}`),
      dispatchCacheSettled: () => calls.push("cacheSettled"),
      dispatchReady: () => calls.push("ready"),
    });

    await primeThenPoll(() => Promise.resolve({}), context, undefined, undefined);

    expect(calls).toEqual(["sync:false", "cacheSettled", "ready"]);
  });

  it("settles the cache before the network is even called, and arms readiness after it", async () => {
    const calls: string[] = [];
    const context = createContext({
      dispatchCacheSettled: () => calls.push("cacheSettled"),
      dispatchReady: () => calls.push("ready"),
    });
    const fetch = () => {
      calls.push("fetch");
      return Promise.reject(new Error("offline"));
    };

    await primeThenPoll(() => Promise.resolve({}), context, fetch, 1_000);

    expect(calls).toEqual(["cacheSettled", "fetch", "ready"]);
  });

  it.each([
    ["the re-resolution", "dispatchSync"],
    ["settling the cache", "dispatchCacheSettled"],
    ["arming readiness", "dispatchReady"],
  ] as const)("still arms every boot signal when %s throws", async (_label, key) => {
    const context = createContext({ [key]: jest.fn(throwing) });

    await expect(
      primeThenPoll(() => Promise.resolve({}), context, undefined, undefined),
    ).resolves.toBeUndefined();

    expect(context.dispatchSync).toHaveBeenCalledTimes(1);
    expect(context.dispatchCacheSettled).toHaveBeenCalledTimes(1);
    expect(context.dispatchReady).toHaveBeenCalledTimes(1);
    expect(context.reportError).toHaveBeenCalledTimes(1);
    expect(context.reportError).toHaveBeenCalledWith(failure, "sync", 1);
  });

  it("still settles the cache and arms readiness when the cache cannot be read", async () => {
    const context = createContext();

    await primeThenPoll(
      () => Promise.reject(new Error("storage unavailable")),
      context,
      undefined,
      undefined,
    );

    expect(context.reportError).toHaveBeenCalledWith(expect.any(Error), "cache", 1);
    expect(context.dispatchCacheSettled).toHaveBeenCalledTimes(1);
    expect(context.dispatchReady).toHaveBeenCalledTimes(1);
  });
});

describe("pollRemoteFlags", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it.each([
    ["the re-resolution", "dispatchSync"],
    ["arming readiness", "dispatchReady"],
  ] as const)(
    "still arms readiness and schedules the next poll when %s throws",
    async (_label, key) => {
      const context = createContext({ [key]: jest.fn(throwing) });
      const fetch = jest.fn(() => Promise.resolve({ mockFeature: { enabled: true } }));

      await expect(pollRemoteFlags({ ...context, fetch, ms: 1_000 })).resolves.toBeUndefined();

      expect(context.ref.current).toEqual({ mockFeature: { enabled: true } });
      expect(context.dispatchReady).toHaveBeenCalledTimes(1);
      expect(context.reportError).toHaveBeenCalledWith(failure, "sync", 1);
      expect(jest.getTimerCount()).toBe(1);
    },
  );

  it("reports a later throwing poll with its own attempt, and keeps polling", async () => {
    const context = createContext({ dispatchSync: jest.fn(throwing) });
    const fetch = jest.fn(() => Promise.resolve({ mockFeature: { enabled: true } }));

    await pollRemoteFlags({ ...context, fetch, ms: 1_000 });
    await jest.advanceTimersByTimeAsync(1_000);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(context.reportError).toHaveBeenNthCalledWith(1, failure, "sync", 1);
    expect(context.reportError).toHaveBeenNthCalledWith(2, failure, "sync", 2);
    expect(jest.getTimerCount()).toBe(1);
  });

  it("reports a failed fetch as remote and a throwing re-resolution as sync, separately", async () => {
    const context = createContext({ dispatchSync: jest.fn(throwing) });
    const networkDown = new Error("network down");

    await pollRemoteFlags({ ...context, fetch: () => Promise.reject(networkDown), ms: 1_000 });

    expect(context.reportError).toHaveBeenNthCalledWith(1, networkDown, "remote", 1);
    expect(context.reportError).toHaveBeenNthCalledWith(2, failure, "sync", 1);
    expect(context.dispatchReady).toHaveBeenCalledTimes(1);
  });
});

describe("createLanguageWatcher", () => {
  it("reads nothing and never dispatches without a selector", () => {
    const dispatch = jest.fn();
    const watcher = createLanguageWatcher(undefined, () => ({}), dispatch);

    expect(watcher.read()).toBeUndefined();
    watcher.checkChange();

    expect(dispatch).not.toHaveBeenCalled();
  });

  it("re-resolves when the language changes", () => {
    const dispatch = jest.fn();
    let lang = "en";
    const watcher = createLanguageWatcher(
      (state: { lang: string }) => state.lang,
      () => ({ lang }),
      dispatch,
    );

    watcher.checkChange();
    expect(dispatch).not.toHaveBeenCalled();

    lang = "de";
    watcher.checkChange();
    expect(dispatch).toHaveBeenCalledWith(syncRemoteConfig());

    watcher.checkChange();
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});

describe("buildFeatureFlagsMeta", () => {
  const action = { type: "featureFlags/setOverride" };
  const resolutionConfig: ResolutionConfig = { platform: "desktop" };
  const remoteFlags = { mockFeature: { enabled: true } };

  it("attaches the resolution context and the remote flags", () => {
    expect(buildFeatureFlagsMeta(action, resolutionConfig, undefined, false, remoteFlags)).toEqual({
      type: "featureFlags/setOverride",
      meta: { resolutionConfig, remoteFlags },
    });
  });

  it("folds the language in only when a selector is configured", () => {
    const withSelector = buildFeatureFlagsMeta(action, resolutionConfig, "fr", true, remoteFlags);
    expect(withSelector.meta.resolutionConfig).toEqual({ platform: "desktop", appLanguage: "fr" });

    const withoutSelector = buildFeatureFlagsMeta(action, resolutionConfig, "fr", false, {});
    expect(withoutSelector.meta.resolutionConfig).toBe(resolutionConfig);
  });

  it("preserves a meta the caller already set", () => {
    const withMeta = { type: "featureFlags/setOverride", meta: { origin: "test" } };

    expect(buildFeatureFlagsMeta(withMeta, resolutionConfig, undefined, false, {}).meta).toEqual({
      origin: "test",
      resolutionConfig,
      remoteFlags: {},
    });
  });
});
