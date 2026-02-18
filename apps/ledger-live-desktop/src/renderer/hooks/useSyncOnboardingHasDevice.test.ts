import { DeviceModelId } from "@ledgerhq/types-devices";
import { act, renderHook, waitFor } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { useSyncOnboardingHasDevice } from "./useSyncOnboardingHasDevice";

jest.mock("~/renderer/analytics/segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
}));

const trackMock = jest.mocked(track);

const lazyOnboardingEnabledFlag = {
  lwdWallet40: {
    enabled: true,
    params: {
      lazyOnboarding: true,
    },
  },
};

describe("useSyncOnboardingHasDevice", () => {
  beforeEach(() => {
    trackMock.mockReset();
  });

  it("should not transition when feature flag is disabled", () => {
    const { store } = renderHook(() => useSyncOnboardingHasDevice(), {
      initialState: {
        settings: {
          onboardingHasDevice: false,
          lastSeenDevice: {
            modelId: DeviceModelId.nanoS,
          },
          overriddenFeatureFlags: {
            lwdWallet40: {
              enabled: true,
              params: {
                lazyOnboarding: false,
              },
            },
          },
        },
      },
    });

    expect(store.getState().settings.onboardingHasDevice).toBe(false);
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("should not transition when onboardingHasDevice is already true", () => {
    const { store } = renderHook(() => useSyncOnboardingHasDevice(), {
      initialState: {
        settings: {
          onboardingHasDevice: true,
          lastSeenDevice: {
            modelId: DeviceModelId.nanoS,
          },
          overriddenFeatureFlags: lazyOnboardingEnabledFlag,
        },
      },
    });

    expect(store.getState().settings.onboardingHasDevice).toBe(true);
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("should not transition when lastSeenDevice is null", () => {
    const { store } = renderHook(() => useSyncOnboardingHasDevice(), {
      initialState: {
        settings: {
          onboardingHasDevice: false,
          lastSeenDevice: null,
          overriddenFeatureFlags: lazyOnboardingEnabledFlag,
        },
      },
    });

    expect(store.getState().settings.onboardingHasDevice).toBe(false);
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("should dispatch setOnboardingHasDevice and fire analytics when lazy user connects a device during session", async () => {
    const { store, rerender } = renderHook(() => useSyncOnboardingHasDevice(), {
      initialState: {
        settings: {
          onboardingHasDevice: false,
          lastSeenDevice: null,
          overriddenFeatureFlags: lazyOnboardingEnabledFlag,
        },
      },
    });

    act(() => {
      store.dispatch({
        type: "SAVE_SETTINGS",
        payload: {
          lastSeenDevice: {
            modelId: DeviceModelId.nanoS,
          },
        },
      });
    });

    rerender();

    await waitFor(() => {
      expect(store.getState().settings.onboardingHasDevice).toBe(true);
    });

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("lazy_onboarding_device_paired");
  });

  it("should dispatch setOnboardingHasDevice without analytics when lastSeenDevice was already set on mount", async () => {
    const { store } = renderHook(() => useSyncOnboardingHasDevice(), {
      initialState: {
        settings: {
          onboardingHasDevice: false,
          lastSeenDevice: {
            modelId: DeviceModelId.nanoS,
          },
          overriddenFeatureFlags: lazyOnboardingEnabledFlag,
        },
      },
    });

    await waitFor(() => {
      expect(store.getState().settings.onboardingHasDevice).toBe(true);
    });

    expect(trackMock).not.toHaveBeenCalled();
  });

  it("should not dispatch twice on subsequent re-renders", async () => {
    const { store, rerender } = renderHook(() => useSyncOnboardingHasDevice(), {
      initialState: {
        settings: {
          onboardingHasDevice: false,
          lastSeenDevice: null,
          overriddenFeatureFlags: lazyOnboardingEnabledFlag,
        },
      },
    });

    act(() => {
      store.dispatch({
        type: "SAVE_SETTINGS",
        payload: {
          lastSeenDevice: {
            modelId: DeviceModelId.nanoS,
          },
        },
      });
    });

    rerender();
    rerender();
    rerender();

    await waitFor(() => {
      expect(store.getState().settings.onboardingHasDevice).toBe(true);
    });

    expect(trackMock).toHaveBeenCalledTimes(1);
  });
});
