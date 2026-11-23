import React from "react";
import { db } from "~/renderer/bridge";
import { render, waitFor, withFlagOverrides } from "tests/testSetup";
import { ConnectEnvsToDatadog } from "./ConnectEnvsToDatadog";

jest.mock("~/datadog/renderer", () => ({
  initDatadog: jest.fn().mockResolvedValue(true),
  setTags: jest.fn(),
  isDatadogAvailable: jest.fn().mockReturnValue(true),
  setDatadogActionsEnabled: jest.fn(),
}));

jest.mock("~/datadog/logs", () => ({
  initDatadogLogs: jest.fn().mockReturnValue(true),
}));

const initDatadog = jest.mocked(jest.requireMock("~/datadog/renderer").initDatadog);
const isDatadogAvailable = jest.mocked(jest.requireMock("~/datadog/renderer").isDatadogAvailable);
const setDatadogActionsEnabled = jest.mocked(
  jest.requireMock("~/datadog/renderer").setDatadogActionsEnabled,
);
const initDatadogLogs = jest.mocked(jest.requireMock("~/datadog/logs").initDatadogLogs);

let remoteFlagsFetched = true;
let cachedFlags: Record<string, unknown> = {};
jest.mock("~/firebase/remoteConfig", () => ({
  readCachedFlags: () => Promise.resolve(cachedFlags),
  subscribeToRemoteFlags: (callback: () => void) => {
    if (remoteFlagsFetched) callback();
    return () => {};
  },
}));

const withCachedFlagsSettled = (...args: Parameters<typeof withFlagOverrides>) => {
  const state = withFlagOverrides(...args);
  return { ...state, featureFlags: { ...state.featureFlags, cachedFlagsSettled: true } };
};

describe("ConnectEnvsToDatadog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isDatadogAvailable.mockReturnValue(true);
    remoteFlagsFetched = true;
    cachedFlags = {};
  });

  it("should render nothing (null)", () => {
    const { container } = render(<ConnectEnvsToDatadog />, {
      initialState: { settings: { crashReporting: false } },
    });
    expect(container.firstChild).toBeNull();
  });

  it.each([true, false])("should follow the lldDatadog flag (%s) for custom actions", enabled => {
    render(<ConnectEnvsToDatadog />, {
      initialState: {
        ...withFlagOverrides({ lldDatadog: { enabled, params: {} } }),
        settings: { crashReporting: true },
      },
    });
    expect(setDatadogActionsEnabled).toHaveBeenLastCalledWith(enabled);
  });

  it("should not call initDatadog when crashReporting is false", async () => {
    render(<ConnectEnvsToDatadog />, {
      initialState: {
        ...withFlagOverrides({ lldDatadog: { enabled: true, params: {} } }),
        settings: {
          crashReporting: false,
        },
      },
    });
    await new Promise(r => setImmediate(r));
    expect(initDatadog).not.toHaveBeenCalled();
  });

  it("should call initDatadog when lldDatadog.enabled, crashReporting, and isDatadogAvailable are true", async () => {
    render(<ConnectEnvsToDatadog />, {
      initialState: {
        ...withFlagOverrides({ lldDatadog: { enabled: true, params: {} } }),
        settings: {
          crashReporting: true,
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
          crashReporting: true,
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
          crashReporting: true,
        },
      },
    });
    await new Promise(r => setImmediate(r));
    expect(initDatadog).toHaveBeenCalled();
    const shouldSend = initDatadog.mock.calls[0]![0] as () => boolean;
    expect(shouldSend()).toBe(true);
    store.dispatch({ type: "SAVE_SETTINGS", payload: { crashReporting: false } });
    expect(shouldSend()).toBe(false);
  });

  it("mirrors nothing to main until a remote fetch succeeded, as the default would revoke consent", async () => {
    remoteFlagsFetched = false;
    render(<ConnectEnvsToDatadog />, {
      initialState: withFlagOverrides({ lldDatadog: { enabled: true, params: {} } }),
    });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(db.setKey).not.toHaveBeenCalledWith("app", "lldDatadog", expect.anything());
  });

  it("mirrors a flag cached from an earlier fetch when the fetch keeps failing", async () => {
    remoteFlagsFetched = false;
    cachedFlags = { lldDatadog: { enabled: true } };
    render(<ConnectEnvsToDatadog />, {
      initialState: withCachedFlagsSettled({ lldDatadog: { enabled: true, params: {} } }),
    });
    await waitFor(() =>
      expect(db.setKey).toHaveBeenCalledWith(
        "app",
        "lldDatadog",
        expect.objectContaining({ enabled: true }),
      ),
    );
  });

  it("persists the resolved lldDatadog flag and session sampling (bypassing the debounce) for main's next boot", async () => {
    render(<ConnectEnvsToDatadog />, {
      initialState: {
        ...withFlagOverrides({
          lldDatadog: {
            enabled: true,
            params: { sessionSamplingRate: 10 },
          },
        }),
        settings: { crashReporting: false },
      },
    });
    await waitFor(() =>
      expect(db.setKey).toHaveBeenCalledWith(
        "app",
        "lldDatadog",
        expect.objectContaining({ enabled: true }),
      ),
    );
    expect(db.setKey).toHaveBeenCalledWith("app", "lldDatadog", {
      enabled: true,
      sessionSampleRate: 10,
    });
  });

  it("mirrors crashReporting to main immediately, bypassing the settings persistence debounce", async () => {
    const { store } = render(<ConnectEnvsToDatadog />, {
      initialState: {
        ...withFlagOverrides({ lldDatadog: { enabled: true, params: {} } }),
        settings: { crashReporting: true },
      },
    });
    expect(db.setKey).toHaveBeenCalledWith("app", "settings.crashReporting", true);
    jest.mocked(db.setKey).mockClear();
    store.dispatch({ type: "SAVE_SETTINGS", payload: { crashReporting: false } });
    await new Promise(r => setImmediate(r));
    expect(db.setKey).toHaveBeenCalledWith("app", "settings.crashReporting", false);
  });
});
