import type { ResolutionConfig } from "../schema";
import { syncRemoteConfig, setRemoteFlagsReady } from "../slice";
import {
  buildFeatureFlagsMeta,
  createDispatchers,
  createErrorReporter,
  createLanguageWatcher,
  primeFromCache,
  type RemoteFlagsRef,
} from "./middleware";

// `pollRemoteFlags` is not unit-tested here: it self-reschedules through `setTimeout`, and the
// store-level suite in `../slice.test.ts` already exercises its loop, its one-shot guards and its
// failure path against a real reducer.

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
      reportError,
    });

    expect(reportError).toHaveBeenCalledWith(expect.any(Error), "cache", 1);
    expect(dispatchSync).not.toHaveBeenCalled();
    expect(dispatchReady).not.toHaveBeenCalled();
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
