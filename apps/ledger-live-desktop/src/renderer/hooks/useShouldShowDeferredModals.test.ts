import { act, renderHook } from "tests/testSetup";
import { useShouldShowDeferredModals } from "./useShouldShowDeferredModals";
import { setHasSeenWalletV4Tour } from "~/renderer/actions/settings";

const tourEnabledOverrides = {
  lwdWallet40: {
    enabled: true,
    params: { tour: true },
  },
};

describe("useShouldShowDeferredModals", () => {
  it("returns false when tour is enabled and user has not seen tour at mount", () => {
    const { result } = renderHook(() => useShouldShowDeferredModals(), {
      initialState: {
        settings: {
          hasSeenWalletV4Tour: false,
          overriddenFeatureFlags: tourEnabledOverrides,
        },
      },
      minimal: false,
    });

    expect(result.current).toBe(false);
  });

  it("returns true when tour is disabled", () => {
    const { result } = renderHook(() => useShouldShowDeferredModals(), {
      initialState: {
        settings: {
          hasSeenWalletV4Tour: false,
          overriddenFeatureFlags: {
            lwdWallet40: { enabled: false },
          },
        },
      },
      minimal: false,
    });

    expect(result.current).toBe(true);
  });

  it("returns true when tour is enabled but user had already seen tour at mount", () => {
    const { result } = renderHook(() => useShouldShowDeferredModals(), {
      initialState: {
        settings: {
          hasSeenWalletV4Tour: true,
          overriddenFeatureFlags: tourEnabledOverrides,
        },
      },
      minimal: false,
    });

    expect(result.current).toBe(true);
  });

  it("stays false after hasSeenTour becomes true in same session (ref frozen at mount)", () => {
    const { result, store } = renderHook(() => useShouldShowDeferredModals(), {
      initialState: {
        settings: {
          hasSeenWalletV4Tour: false,
          overriddenFeatureFlags: tourEnabledOverrides,
        },
      },
      minimal: false,
    });

    expect(result.current).toBe(false);

    act(() => {
      store.dispatch(setHasSeenWalletV4Tour(true));
    });

    expect(result.current).toBe(false);
  });
});
