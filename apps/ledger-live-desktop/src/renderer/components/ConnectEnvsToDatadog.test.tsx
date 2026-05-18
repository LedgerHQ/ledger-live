import React from "react";
import { render, withFlagOverrides } from "tests/testSetup";
import { ConnectEnvsToDatadog } from "./ConnectEnvsToDatadog";

jest.mock("~/datadog/renderer", () => ({
  initDatadog: jest.fn().mockResolvedValue(true),
  setTags: jest.fn(),
  isDatadogAvailable: jest.fn().mockReturnValue(true),
}));

jest.mock("~/datadog/logs", () => ({
  initDatadogLogs: jest.fn().mockReturnValue(true),
}));

const initDatadog = jest.mocked(jest.requireMock("~/datadog/renderer").initDatadog);
const isDatadogAvailable = jest.mocked(jest.requireMock("~/datadog/renderer").isDatadogAvailable);
const initDatadogLogs = jest.mocked(jest.requireMock("~/datadog/logs").initDatadogLogs);

describe("ConnectEnvsToDatadog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isDatadogAvailable.mockReturnValue(true);
  });

  it("should render nothing (null)", () => {
    const { container } = render(<ConnectEnvsToDatadog />, {
      initialState: { settings: { sentryLogs: false } },
    });
    expect(container.firstChild).toBeNull();
  });

  it("should not call initDatadog when sentryLogs is false", async () => {
    render(<ConnectEnvsToDatadog />, {
      initialState: {
        ...withFlagOverrides({ lldDatadog: { enabled: true, params: {} } }),
        settings: {
          sentryLogs: false,
        },
      },
    });
    await new Promise(r => setImmediate(r));
    expect(initDatadog).not.toHaveBeenCalled();
  });

  it("should call initDatadog when lldDatadog.enabled, sentryLogs and isDatadogAvailable are true", async () => {
    render(<ConnectEnvsToDatadog />, {
      initialState: {
        ...withFlagOverrides({ lldDatadog: { enabled: true, params: {} } }),
        settings: {
          sentryLogs: true,
        },
      },
    });
    await new Promise(r => setImmediate(r));
    expect(initDatadog).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({}),
      expect.anything(),
    );
  });

  it("should call initDatadogLogs with a shouldSend callback under the same gating", async () => {
    render(<ConnectEnvsToDatadog />, {
      initialState: {
        ...withFlagOverrides({ lldDatadog: { enabled: true, params: {} } }),
        settings: {
          sentryLogs: true,
        },
      },
    });
    await new Promise(r => setImmediate(r));
    expect(initDatadogLogs).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should pass shouldSend that reads current store so opt-out is respected after init", async () => {
    const { store } = render(<ConnectEnvsToDatadog />, {
      initialState: {
        ...withFlagOverrides({ lldDatadog: { enabled: true, params: {} } }),
        settings: {
          sentryLogs: true,
        },
      },
    });
    await new Promise(r => setImmediate(r));
    expect(initDatadog).toHaveBeenCalled();
    const shouldSend = initDatadog.mock.calls[0]![0] as () => boolean;
    expect(shouldSend()).toBe(true);
    store.dispatch({ type: "SAVE_SETTINGS", payload: { sentryLogs: false } });
    expect(shouldSend()).toBe(false);
  });
});
