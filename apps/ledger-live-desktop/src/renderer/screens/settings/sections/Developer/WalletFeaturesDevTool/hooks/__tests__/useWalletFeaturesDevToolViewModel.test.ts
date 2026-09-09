import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { useWalletFeaturesDevToolViewModel } from "../useWalletFeaturesDevToolViewModel";

describe("useWalletFeaturesDevToolViewModel", () => {
  it("should enable the Q2 release tour", () => {
    const { result, store } = renderHook(() => useWalletFeaturesDevToolViewModel());

    act(() => {
      result.current.handleToggleQ2TourEnabled();
    });

    expect(store.getState().featureFlags.overrides.releaseTour).toEqual({
      enabled: true,
      params: { variant: "q2" },
    });
  });

  it("should disable the Q2 release tour while retaining its variant", () => {
    const { result, store } = renderHook(() => useWalletFeaturesDevToolViewModel(), {
      initialState: withFlagOverrides({
        releaseTour: { enabled: true, params: { variant: "q2" } },
      }),
    });

    act(() => {
      result.current.handleToggleQ2TourEnabled();
    });

    expect(store.getState().featureFlags.overrides.releaseTour).toEqual({
      enabled: false,
      params: { variant: "q2" },
    });
  });

  it("should reset the persisted Q2 tour seen state", () => {
    const { result, store } = renderHook(() => useWalletFeaturesDevToolViewModel(), {
      initialState: { settings: { hasSeenQ2Tour: true } },
    });

    act(() => {
      result.current.handleToggleQ2TourHasSeen();
    });

    expect(store.getState().settings.hasSeenQ2Tour).toBe(false);
  });
});
