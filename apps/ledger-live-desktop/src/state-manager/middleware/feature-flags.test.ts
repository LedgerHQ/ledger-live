import { setEnv } from "@shared/env";
import { createFeatureFlagsMiddleware, type FeatureFlagsReadFailure } from "@shared/feature-flags";
import { fetchRemoteFlags, readCachedFlags } from "~/firebase/remoteConfig";
import appLogger from "~/renderer/logger";
import { languageSelector } from "~/renderer/reducers/settings";
import { createDesktopFeatureFlagsMiddleware } from "./feature-flags";

jest.mock("@shared/feature-flags", () => ({
  ...jest.requireActual("@shared/feature-flags"),
  createFeatureFlagsMiddleware: jest.fn(),
}));
jest.mock("~/firebase/remoteConfig", () => ({
  fetchRemoteFlags: jest.fn(),
  readCachedFlags: jest.fn(),
}));
jest.mock("~/renderer/logger", () => ({
  __esModule: true,
  default: { critical: jest.fn() },
}));

function middlewareConfig() {
  const { calls } = jest.mocked(createFeatureFlagsMiddleware).mock;
  expect(calls).toHaveLength(1);
  return calls[0][0];
}

beforeEach(() => {
  jest.mocked(createFeatureFlagsMiddleware).mockClear();
  jest.mocked(appLogger.critical).mockClear();
  setEnv("FEATURE_FLAGS", {});
});

describe("createDesktopFeatureFlagsMiddleware", () => {
  it("resolves for the desktop platform, the app version and the env flags", () => {
    const envFlags = { mockFeature: { enabled: true } };
    setEnv("FEATURE_FLAGS", envFlags);

    createDesktopFeatureFlagsMiddleware();

    expect(middlewareConfig().resolutionConfig).toEqual({
      platform: "desktop",
      appVersion: __APP_VERSION__,
      envFlags,
    });
  });

  it("follows the app language", () => {
    createDesktopFeatureFlagsMiddleware();

    expect(middlewareConfig().getAppLanguage).toBe(languageSelector);
  });

  it("reads through Firebase by default", () => {
    createDesktopFeatureFlagsMiddleware();

    const config = middlewareConfig();
    expect(config.fetchRemoteFlags).toBe(fetchRemoteFlags);
    expect(config.readCachedFlags).toBe(readCachedFlags);
  });

  it("opts out of the whole Firebase path when the fetcher is disabled", () => {
    createDesktopFeatureFlagsMiddleware({ fetchRemoteFlags: null });

    const config = middlewareConfig();
    expect(config.fetchRemoteFlags).toBeUndefined();
    expect(config.readCachedFlags).toBeUndefined();
  });

  it("keeps polling Firebase when only the cache reader is disabled", () => {
    createDesktopFeatureFlagsMiddleware({ readCachedFlags: null });

    const config = middlewareConfig();
    expect(config.fetchRemoteFlags).toBe(fetchRemoteFlags);
    expect(config.readCachedFlags).toBeUndefined();
  });

  it("keeps a custom cache reader even when the fetcher is disabled", () => {
    const customReader = jest.fn(() => Promise.resolve({}));

    createDesktopFeatureFlagsMiddleware({ fetchRemoteFlags: null, readCachedFlags: customReader });

    const config = middlewareConfig();
    expect(config.fetchRemoteFlags).toBeUndefined();
    expect(config.readCachedFlags).toBe(customReader);
  });

  it("passes custom sources through unchanged", () => {
    const customFetcher = jest.fn(() => Promise.resolve({}));
    const customReader = jest.fn(() => Promise.resolve({}));

    createDesktopFeatureFlagsMiddleware({
      fetchRemoteFlags: customFetcher,
      readCachedFlags: customReader,
    });

    const config = middlewareConfig();
    expect(config.fetchRemoteFlags).toBe(customFetcher);
    expect(config.readCachedFlags).toBe(customReader);
  });
});

describe("feature flags read failure reporting", () => {
  function report(error: unknown, failure: FeatureFlagsReadFailure) {
    createDesktopFeatureFlagsMiddleware();
    const { onRemoteFlagsError } = middlewareConfig();
    if (!onRemoteFlagsError) throw new Error("onRemoteFlagsError is not wired");
    onRemoteFlagsError(error, failure);
  }

  it.each<FeatureFlagsReadFailure>([
    { stage: "cache", attempt: 1, isCold: true },
    { stage: "remote", attempt: 1, isCold: true },
    { stage: "remote", attempt: 3, isCold: true },
  ])("reports a cold $stage failure at attempt $attempt", failure => {
    const error = new Error("boom");

    report(error, failure);

    expect(appLogger.critical).toHaveBeenCalledWith(
      error,
      `Feature flags: ${failure.stage} read failed, resolving on compiled defaults`,
    );
  });

  it.each<FeatureFlagsReadFailure>([
    { stage: "remote", attempt: 1, isCold: false },
    { stage: "remote", attempt: 2, isCold: false },
  ])("ignores a warm remote failure at attempt $attempt", failure => {
    report(new Error("boom"), failure);

    expect(appLogger.critical).not.toHaveBeenCalled();
  });

  it.each([true, false])("reports a boot sync failure, isCold %s", isCold => {
    const error = new Error("reducer blew up");

    report(error, { stage: "sync", attempt: 1, isCold });

    expect(appLogger.critical).toHaveBeenCalledWith(
      error,
      "Feature flags: re-resolution failed at boot, running on compiled defaults",
    );
  });

  it.each([true, false])("ignores a sync failure after boot, isCold %s", isCold => {
    report(new Error("boom"), { stage: "sync", attempt: 2, isCold });

    expect(appLogger.critical).not.toHaveBeenCalled();
  });
});
