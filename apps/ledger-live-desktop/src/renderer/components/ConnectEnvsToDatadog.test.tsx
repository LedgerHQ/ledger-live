import React from "react";
import { act, render } from "tests/testSetup";
import { ConnectEnvsToDatadog } from "./ConnectEnvsToDatadog";

jest.mock("~/datadog/renderer", () => ({
  initDatadog: jest.fn().mockResolvedValue(true),
  setTags: jest.fn(),
  isDatadogAvailable: jest.fn().mockReturnValue(true),
}));

const mockGetFeature = jest.fn();
jest.mock("@ledgerhq/live-common/featureFlags/index", () => ({
  DEFAULT_FEATURES: {},
  useFeatureFlags: jest.fn(() => ({
    getFeature: mockGetFeature,
  })),
}));

const mockEnabledExperimentalFeatures = jest.fn();
jest.mock("~/renderer/experimental", () => ({
  enabledExperimentalFeatures: () => mockEnabledExperimentalFeatures(),
}));

jest.mock("~/renderer/components/FirebaseFeatureFlags", () => ({
  FirebaseFeatureFlagsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const initDatadog = jest.mocked(jest.requireMock("~/datadog/renderer").initDatadog);
const setTags = jest.mocked(jest.requireMock("~/datadog/renderer").setTags);
const isDatadogAvailable = jest.mocked(jest.requireMock("~/datadog/renderer").isDatadogAvailable);

describe("ConnectEnvsToDatadog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isDatadogAvailable.mockReturnValue(true);
    mockEnabledExperimentalFeatures.mockReturnValue([]);
  });

  it("should render nothing (null)", () => {
    const { container } = render(<ConnectEnvsToDatadog />, {
      initialState: {
        settings: { sentryLogs: false },
      },
    });
    expect(container.firstChild).toBeNull();
  });

  it("should not call initDatadog when sentryLogs is false", async () => {
    render(<ConnectEnvsToDatadog />, {
      initialState: {
        settings: { sentryLogs: false },
      },
    });
    await new Promise(r => setImmediate(r));
    expect(initDatadog).not.toHaveBeenCalled();
  });

  it("should not call initDatadog when isDatadogAvailable returns false", async () => {
    isDatadogAvailable.mockReturnValue(false);
    mockGetFeature.mockReturnValue({ enabled: true });
    render(<ConnectEnvsToDatadog />, {
      initialState: {
        settings: { sentryLogs: true },
      },
    });
    await new Promise(r => setImmediate(r));
    expect(initDatadog).not.toHaveBeenCalled();
  });

  it("should call initDatadog when lldDatadog.enabled, sentryLogs and isDatadogAvailable are true", async () => {
    mockGetFeature.mockReturnValue({ enabled: true, params: {} });
    render(<ConnectEnvsToDatadog />, {
      initialState: {
        settings: { sentryLogs: true },
      },
    });
    await new Promise(r => setImmediate(r));
    expect(initDatadog).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({}),
      expect.anything(),
    );
  });

  it("should call initDatadog with lldDatadog params when provided", async () => {
    mockGetFeature.mockReturnValue({
      enabled: true,
      params: {
        sessionSamplingRate: 50,
        sessionReplaySampleRate: 10,
      },
    });
    render(<ConnectEnvsToDatadog />, {
      initialState: {
        settings: { sentryLogs: true },
      },
    });
    await new Promise(r => setImmediate(r));
    expect(initDatadog).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        sessionSampleRate: 50,
        sessionReplaySampleRate: 10,
      }),
      expect.anything(),
    );
  });

  it("should sync tags after init: setTags called after 5s with env and feature tags", async () => {
    jest.useFakeTimers();
    mockGetFeature.mockReturnValue({ enabled: true, params: {} });
    mockEnabledExperimentalFeatures.mockReturnValue(["EXPERIMENTAL_KEY"]);
    render(<ConnectEnvsToDatadog />, {
      initialState: { settings: { sentryLogs: true } },
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(initDatadog).toHaveBeenCalled();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(setTags).toHaveBeenCalled();
    const tagsArg = setTags.mock.calls[setTags.mock.calls.length - 1]?.[0];
    expect(tagsArg).toBeDefined();
    expect(typeof tagsArg).toBe("object");
    jest.useRealTimers();
  });

  it("should clear timeout and interval on unmount", async () => {
    const clearTimeoutSpy = jest.spyOn(globalThis, "clearTimeout");
    const clearIntervalSpy = jest.spyOn(globalThis, "clearInterval");
    mockGetFeature.mockReturnValue({ enabled: true, params: {} });
    const { unmount } = render(<ConnectEnvsToDatadog />, {
      initialState: { settings: { sentryLogs: true } },
    });
    await new Promise(r => setImmediate(r));
    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
    clearIntervalSpy.mockRestore();
  });

  it("should not set datadogInitialized when initDatadog resolves to false", async () => {
    initDatadog.mockResolvedValue(false);
    mockGetFeature.mockReturnValue({ enabled: true, params: {} });
    jest.useFakeTimers();
    render(<ConnectEnvsToDatadog />, {
      initialState: { settings: { sentryLogs: true } },
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(initDatadog).toHaveBeenCalled();
    setTags.mockClear();
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(setTags).not.toHaveBeenCalled();
    jest.useRealTimers();
    initDatadog.mockResolvedValue(true);
  });

  it("should truncate long tag keys via safekey", async () => {
    mockGetFeature.mockReturnValue({ enabled: true, params: {} });
    mockEnabledExperimentalFeatures.mockReturnValue([
      "EXPERIMENTAL_KEY_WITH_VERY_LONG_NAME_EXCEEDING_32_CHARS",
    ]);
    jest.useFakeTimers();
    render(<ConnectEnvsToDatadog />, {
      initialState: { settings: { sentryLogs: true } },
    });
    await act(async () => {
      await Promise.resolve();
    });
    await act(async () => {
      jest.advanceTimersByTime(5000);
    });
    expect(setTags).toHaveBeenCalled();
    const tagsArg = setTags.mock.calls[setTags.mock.calls.length - 1]?.[0];
    expect(tagsArg).toBeDefined();
    const keys = Object.keys(tagsArg as Record<string, unknown>);
    const longKey = keys.find(k => k.includes(".."));
    expect(longKey).toBeDefined();
    expect(longKey!.length).toBeLessThanOrEqual(32);
    jest.useRealTimers();
  });

  it("should not init when lldDatadog feature has invalid params shape", async () => {
    mockGetFeature.mockReturnValue({ enabled: true, params: "invalid" as unknown as object });
    render(<ConnectEnvsToDatadog />, {
      initialState: { settings: { sentryLogs: true } },
    });
    await new Promise(r => setImmediate(r));
    expect(initDatadog).not.toHaveBeenCalled();
  });

  it("should pass shouldSend that reads current store so opt-out is respected after init", async () => {
    mockGetFeature.mockReturnValue({ enabled: true, params: {} });
    const { store } = render(<ConnectEnvsToDatadog />, {
      initialState: { settings: { sentryLogs: true } },
    });
    await new Promise(r => setImmediate(r));
    expect(initDatadog).toHaveBeenCalled();
    const shouldSend = initDatadog.mock.calls[0]![0] as () => boolean;
    expect(shouldSend()).toBe(true);
    store.dispatch({ type: "SAVE_SETTINGS", payload: { sentryLogs: false } });
    expect(shouldSend()).toBe(false);
  });
});
