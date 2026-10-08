import { Platform } from "react-native";
import { DdRum, ErrorSource } from "@datadog/mobile-react-native";
import { setEnv } from "@shared/env";
import { createFeatureFlagsMiddleware, type FeatureFlagsReadFailure } from "@shared/feature-flags";
import { fetchRemoteFlags, readCachedFlags } from "~/firebase/remoteConfig";
import { languageSelector } from "~/reducers/settings";
import { createMobileFeatureFlagsMiddleware } from "./feature-flags";

let mockAppVersion: string | null = "4.21.0";
let mockIsDatadogEnabled = true;

jest.mock("@shared/feature-flags", () => ({
  ...jest.requireActual("@shared/feature-flags"),
  createFeatureFlagsMiddleware: jest.fn(),
}));
jest.mock("~/firebase/remoteConfig", () => ({
  fetchRemoteFlags: jest.fn(),
  readCachedFlags: jest.fn(),
}));
jest.mock("LLM/utils/appVersion", () => ({
  get appVersion() {
    return mockAppVersion ?? "";
  },
}));
jest.mock("@datadog/mobile-react-native", () => ({
  DdRum: { addError: jest.fn() },
  ErrorSource: { SOURCE: "SOURCE" },
}));
jest.mock("~/datadog", () => ({
  get isDatadogEnabled() {
    return mockIsDatadogEnabled;
  },
}));

function middlewareConfig() {
  const { calls } = jest.mocked(createFeatureFlagsMiddleware).mock;
  expect(calls).toHaveLength(1);
  return calls[0][0];
}

beforeEach(() => {
  mockAppVersion = "4.21.0";
  mockIsDatadogEnabled = true;
  jest.mocked(createFeatureFlagsMiddleware).mockClear();
  jest.mocked(DdRum.addError).mockClear();
  setEnv("FEATURE_FLAGS", {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("createMobileFeatureFlagsMiddleware", () => {
  it("resolves for the app version and the env flags", () => {
    const envFlags = { mockFeature: { enabled: true } };
    setEnv("FEATURE_FLAGS", envFlags);

    createMobileFeatureFlagsMiddleware();

    expect(middlewareConfig().resolutionConfig).toMatchObject({
      appVersion: "4.21.0",
      envFlags,
    });
  });

  it.each(["ios", "android"] as const)("resolves for the %s platform", os => {
    jest.replaceProperty(Platform, "OS", os);

    createMobileFeatureFlagsMiddleware();

    expect(middlewareConfig().resolutionConfig.platform).toBe(os);
  });

  it("leaves the app version unset when the native module has none", () => {
    mockAppVersion = null;

    createMobileFeatureFlagsMiddleware();

    expect(middlewareConfig().resolutionConfig.appVersion).toBeUndefined();
  });

  it("reads through Firebase and follows the app language", () => {
    createMobileFeatureFlagsMiddleware();

    const config = middlewareConfig();
    expect(config.fetchRemoteFlags).toBe(fetchRemoteFlags);
    expect(config.readCachedFlags).toBe(readCachedFlags);
    expect(config.getAppLanguage).toBe(languageSelector);
  });
});

describe("feature flags read failure reporting", () => {
  const bootSyncMessage =
    "Feature flags: re-resolution failed at boot, running on compiled defaults";
  let consoleError: jest.SpyInstance;

  beforeEach(() => {
    consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  function report(error: unknown, failure: FeatureFlagsReadFailure) {
    createMobileFeatureFlagsMiddleware();
    const { onRemoteFlagsError } = middlewareConfig();
    if (!onRemoteFlagsError) throw new Error("onRemoteFlagsError is not wired");
    onRemoteFlagsError(error, failure);
  }

  it.each<FeatureFlagsReadFailure>([
    { stage: "cache", attempt: 1, isCold: true },
    { stage: "remote", attempt: 1, isCold: true },
    { stage: "remote", attempt: 3, isCold: true },
  ])("logs a cold $stage failure at attempt $attempt, without Datadog", failure => {
    const error = new Error("boom");

    report(error, failure);

    expect(consoleError).toHaveBeenCalledWith(
      `Feature flags: ${failure.stage} read failed, resolving on compiled defaults`,
      error,
    );
    expect(DdRum.addError).not.toHaveBeenCalled();
  });

  it.each<FeatureFlagsReadFailure>([
    { stage: "remote", attempt: 1, isCold: false },
    { stage: "remote", attempt: 2, isCold: false },
  ])("ignores a warm remote failure at attempt $attempt", failure => {
    report(new Error("boom"), failure);

    expect(consoleError).not.toHaveBeenCalled();
    expect(DdRum.addError).not.toHaveBeenCalled();
  });

  it.each([true, false])("logs a boot sync failure and sends it to Datadog, isCold %s", isCold => {
    const error = new Error("reducer blew up");

    report(error, { stage: "sync", attempt: 1, isCold });

    expect(consoleError).toHaveBeenCalledWith(bootSyncMessage, error);
    expect(DdRum.addError).toHaveBeenCalledWith(bootSyncMessage, ErrorSource.SOURCE, error.stack);
  });

  it("sends an empty stack to Datadog when the thrown value is not an Error", () => {
    report("not an error", { stage: "sync", attempt: 1, isCold: true });

    expect(DdRum.addError).toHaveBeenCalledWith(bootSyncMessage, ErrorSource.SOURCE, "");
  });

  it("only logs a boot sync failure when Datadog is disabled", () => {
    mockIsDatadogEnabled = false;
    const error = new Error("reducer blew up");

    report(error, { stage: "sync", attempt: 1, isCold: true });

    expect(consoleError).toHaveBeenCalledWith(bootSyncMessage, error);
    expect(DdRum.addError).not.toHaveBeenCalled();
  });

  it.each([true, false])("ignores a sync failure after boot, isCold %s", isCold => {
    report(new Error("boom"), { stage: "sync", attempt: 2, isCold });

    expect(consoleError).not.toHaveBeenCalled();
    expect(DdRum.addError).not.toHaveBeenCalled();
  });
});
