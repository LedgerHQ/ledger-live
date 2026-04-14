import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import BuyDeviceNavigator from "~/components/RootNavigator/BuyDeviceNavigator";
import PostBuyDeviceSetupNanoWallScreen from "~/screens/PostBuyDeviceSetupNanoWallScreen";
import { useNoNanoBuyNanoWallScreenOptions } from "./NoNanoBuyNanoWall";

type TestStateOverrides = {
  hasCompletedOnboarding?: boolean;
  hasOrderedNano?: boolean;
  readOnlyModeEnabled?: boolean;
  lazyOnboarding?: boolean;
};

const overrideInitialState = ({
  hasCompletedOnboarding = true,
  hasOrderedNano = false,
  readOnlyModeEnabled = true,
  lazyOnboarding = false,
}: TestStateOverrides = {}) =>
  withFlagOverrides(
    {
      lwmWallet40: {
        enabled: true,
        params: {
          lazyOnboarding,
        },
      },
    },
    (state: State): State => ({
      ...state,
      settings: {
        ...state.settings,
        hasCompletedOnboarding,
        hasOrderedNano,
        readOnlyModeEnabled,
      },
    }),
  );

describe("useNoNanoBuyNanoWallScreenOptions", () => {
  it("should not gate when onboarding is not completed and read only mode is disabled", () => {
    const { result } = renderHook(() => useNoNanoBuyNanoWallScreenOptions(), {
      overrideInitialState: overrideInitialState({
        hasCompletedOnboarding: false,
        readOnlyModeEnabled: false,
      }),
    });

    expect(result.current).toEqual({});
  });

  it("should not gate when onboarding is not completed and read only mode is enabled", () => {
    const { result } = renderHook(() => useNoNanoBuyNanoWallScreenOptions(), {
      overrideInitialState: overrideInitialState({
        hasCompletedOnboarding: false,
        readOnlyModeEnabled: true,
      }),
    });

    expect(result.current).toEqual({});
  });

  it("should not gate when onboarding is completed and read only mode is disabled", () => {
    const { result } = renderHook(() => useNoNanoBuyNanoWallScreenOptions(), {
      overrideInitialState: overrideInitialState({
        hasCompletedOnboarding: true,
        readOnlyModeEnabled: false,
      }),
    });

    expect(result.current).toEqual({});
  });

  it("should not gate when onboarding is completed, read only mode is enabled, and lazy onboarding is enabled", () => {
    const { result } = renderHook(() => useNoNanoBuyNanoWallScreenOptions(), {
      overrideInitialState: overrideInitialState({
        hasCompletedOnboarding: true,
        lazyOnboarding: true,
        readOnlyModeEnabled: true,
      }),
    });

    expect(result.current).toEqual({});
  });

  it("should gate to buy device when onboarding is completed, read only mode is enabled, lazy onboarding is disabled, and no nano was ordered", () => {
    const { result } = renderHook(() => useNoNanoBuyNanoWallScreenOptions(), {
      overrideInitialState: overrideInitialState({
        hasCompletedOnboarding: true,
        hasOrderedNano: false,
        lazyOnboarding: false,
        readOnlyModeEnabled: true,
      }),
    });

    expect(result.current).toEqual({
      component: BuyDeviceNavigator,
      options: {
        headerShown: false,
        presentation: "transparentModal",
        animation: "slide_from_bottom",
      },
    });
  });

  it("should gate to post buy setup when onboarding is completed, read only mode is enabled, lazy onboarding is disabled, and a nano was ordered", () => {
    const { result } = renderHook(() => useNoNanoBuyNanoWallScreenOptions(), {
      overrideInitialState: overrideInitialState({
        hasCompletedOnboarding: true,
        hasOrderedNano: true,
        lazyOnboarding: false,
        readOnlyModeEnabled: true,
      }),
    });

    expect(result.current).toEqual({
      component: PostBuyDeviceSetupNanoWallScreen,
      options: expect.objectContaining({
        headerShown: false,
        presentation: "transparentModal",
        contentStyle: { opacity: 1 },
        gestureEnabled: true,
        headerTitle: "",
        headerBackButtonDisplayMode: "minimal",
        title: undefined,
      }),
    });
  });
});
