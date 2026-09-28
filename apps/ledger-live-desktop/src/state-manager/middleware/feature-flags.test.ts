import { setEnv } from "@shared/env";
import { createFeatureFlagsMiddleware } from "@shared/feature-flags";
import { fetchRemoteFlags, readCachedFlags } from "~/firebase/remoteConfig";
import { languageSelector } from "~/renderer/reducers/settings";
import { createDesktopFeatureFlagsMiddleware } from "./feature-flags";
import { reportFeatureFlagsReadFailure } from "./reportFeatureFlagsReadFailure";

jest.mock("@shared/feature-flags", () => ({
  ...jest.requireActual("@shared/feature-flags"),
  createFeatureFlagsMiddleware: jest.fn(),
}));
jest.mock("~/firebase/remoteConfig", () => ({
  fetchRemoteFlags: jest.fn(),
  readCachedFlags: jest.fn(),
}));

function middlewareConfig() {
  const { calls } = jest.mocked(createFeatureFlagsMiddleware).mock;
  expect(calls).toHaveLength(1);
  return calls[0][0];
}

describe("createDesktopFeatureFlagsMiddleware", () => {
  beforeEach(() => {
    jest.mocked(createFeatureFlagsMiddleware).mockClear();
    setEnv("FEATURE_FLAGS", {});
  });

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

  it("follows the app language and routes read failures to the desktop reporter", () => {
    createDesktopFeatureFlagsMiddleware();

    const config = middlewareConfig();
    expect(config.getAppLanguage).toBe(languageSelector);
    expect(config.onRemoteFlagsError).toBe(reportFeatureFlagsReadFailure);
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
