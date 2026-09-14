import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { useReleaseToursDevToolViewModel } from "../useReleaseToursDevToolViewModel";

describe("useReleaseToursDevToolViewModel", () => {
  it("should enable the Q2 release tour", () => {
    const { result, store } = renderHook(() => useReleaseToursDevToolViewModel());

    act(() => {
      result.current.handleToggleQ2TourEnabled();
    });

    expect(store.getState().featureFlags.overrides.releaseTour).toEqual({
      enabled: true,
      params: { variant: "q2" },
    });
  });

  it("should disable the Q2 release tour while retaining its variant", () => {
    const { result, store } = renderHook(() => useReleaseToursDevToolViewModel(), {
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
    const { result, store } = renderHook(() => useReleaseToursDevToolViewModel(), {
      initialState: { settings: { hasSeenQ2Tour: true } },
    });

    act(() => {
      result.current.handleToggleQ2TourHasSeen();
    });

    expect(store.getState().settings.hasSeenQ2Tour).toBe(false);
  });
});
