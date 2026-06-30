import { act, renderHook, withFlagOverrides } from "@tests/test-renderer";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { State } from "~/reducers/types";
import { ScreenName } from "~/const";
import { useRecoverEntry, DEFAULT_PROTECT_ID } from "LLM/hooks/useRecoverEntry";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockDevice: Device = {
  modelId: DeviceModelId.nanoX,
  deviceId: "test-device-id",
  deviceName: "Nano X",
  wired: false,
};

const withDevice = (state: State): State => ({
  ...state,
  settings: { ...state.settings, lastConnectedDevice: mockDevice },
});

const withHasClickedRecover = (state: State): State => ({
  ...state,
  settings: { ...state.settings, hasClickedRecover: true },
});

describe("useRecoverEntry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves the protectId from the protectServicesMobile feature flag", () => {
    const { result } = renderHook(() => useRecoverEntry());

    // The test environment provides the protectServicesMobile feature flag default.
    expect(result.current.protectId).toBe("protect-simu");
  });

  it("falls back to DEFAULT_PROTECT_ID when the feature flag has no protectId param", () => {
    const { result } = renderHook(() => useRecoverEntry(), {
      overrideInitialState: withFlagOverrides({
        protectServicesMobile: { enabled: true, params: { protectId: undefined } },
      }),
    });

    expect(result.current.protectId).toBe(DEFAULT_PROTECT_ID);
  });

  it("navigates to the Recover screen with the resolved protectId and no device by default", () => {
    const { result } = renderHook(() => useRecoverEntry());

    act(() => result.current.openRecover());

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.Recover, {
      platform: "protect-simu",
      device: undefined,
    });
  });

  it("forwards the last connected device when navigating to Recover", () => {
    const { result } = renderHook(() => useRecoverEntry(), {
      overrideInitialState: withDevice,
    });

    act(() => result.current.openRecover());

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.Recover, {
      platform: "protect-simu",
      device: mockDevice,
    });
  });

  it("persists hasClickedRecover the first time markRecoverSeen runs", () => {
    const { result, store } = renderHook(() => useRecoverEntry());

    expect(store.getState().settings.hasClickedRecover).toBe(false);

    act(() => result.current.markRecoverSeen());

    expect(store.getState().settings.hasClickedRecover).toBe(true);
  });

  it("does not dispatch again when recover has already been seen", () => {
    const { result, store } = renderHook(() => useRecoverEntry(), {
      overrideInitialState: withHasClickedRecover,
    });

    const dispatchSpy = jest.spyOn(store, "dispatch");

    act(() => result.current.markRecoverSeen());

    const hasClickedRecoverDispatches = dispatchSpy.mock.calls.filter(
      ([action]) => action.type === "SET_HAS_CLICKED_RECOVER",
    );
    expect(hasClickedRecoverDispatches).toHaveLength(0);
  });
});
