import { act, renderHook, withFlagOverrides } from "tests/testSetup";
import { useShouldShowDeferredModals } from "./useShouldShowDeferredModals";
import { setHasSeenQ2Tour } from "~/renderer/actions/settings";

const q2TourEnabledOverrides = {
  releaseTour: { enabled: true, params: { variant: "q2" as const } },
};

describe("useShouldShowDeferredModals", () => {
  it("returns false when Q2 tour is enabled and user has not seen tour at mount", () => {
    const { result } = renderHook(() => useShouldShowDeferredModals(), {
      initialState: {
        ...withFlagOverrides(q2TourEnabledOverrides),
        settings: {
          hasSeenQ2Tour: false,
        },
      },
      minimal: false,
    });

    expect(result.current).toBe(false);
  });

  it("returns true when Q2 tour is enabled but user had already seen tour at mount", () => {
    const { result } = renderHook(() => useShouldShowDeferredModals(), {
      initialState: {
        ...withFlagOverrides(q2TourEnabledOverrides),
        settings: {
          hasSeenQ2Tour: true,
        },
      },
      minimal: false,
    });

    expect(result.current).toBe(true);
  });

  it("stays false after Q2 hasSeen becomes true in same session (ref frozen at mount)", () => {
    const { result, store } = renderHook(() => useShouldShowDeferredModals(), {
      initialState: {
        ...withFlagOverrides(q2TourEnabledOverrides),
        settings: {
          hasSeenQ2Tour: false,
        },
      },
      minimal: false,
    });

    expect(result.current).toBe(false);

    act(() => {
      store.dispatch(setHasSeenQ2Tour(true));
    });

    expect(result.current).toBe(false);
  });
});
