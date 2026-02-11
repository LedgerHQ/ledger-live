import { act, renderHook } from "@tests/test-renderer";
import { useNavigation } from "@react-navigation/native";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { useNotifications } from "LLM/features/NotificationsPrompt";
import useAnalyticsOptInPromptLogic from "./useAnalyticsOptInPromptLogic";
import { NavigatorName, ScreenName } from "~/const";
import { updateIdentify } from "~/analytics";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: jest.fn(),
  };
});

jest.mock("@ledgerhq/live-common/featureFlags/index", () => {
  const actual = jest.requireActual("@ledgerhq/live-common/featureFlags/index");
  return {
    ...actual,
    useWalletFeaturesConfig: jest.fn(),
  };
});

jest.mock("LLM/features/NotificationsPrompt", () => ({
  useNotifications: jest.fn(),
}));

jest.mock("~/analytics", () => {
  const actual = jest.requireActual("~/analytics");
  return {
    ...actual,
    updateIdentify: jest.fn(),
  };
});

const mockedUseNavigation = jest.mocked(useNavigation);
const mockedUseWalletFeaturesConfig = jest.mocked(useWalletFeaturesConfig);
const mockedUseNotifications = jest.mocked(useNotifications);
const mockedUpdateIdentify = jest.mocked(updateIdentify);

const mockNavigate = jest.fn();
const mockTryTriggerPushNotificationDrawerAfterAction = jest.fn();

describe("useAnalyticsOptInPromptLogic", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseNavigation.mockReturnValue({ navigate: mockNavigate } as never);
    mockedUseNotifications.mockReturnValue({
      tryTriggerPushNotificationDrawerAfterAction: mockTryTriggerPushNotificationDrawerAfterAction,
    } as never);
  });

  it("navigates to onboarding device selection path when lazy onboarding is disabled", () => {
    mockedUseWalletFeaturesConfig.mockReturnValue({
      isEnabled: true,
      shouldDisplayMarketBanner: false,
      shouldDisplayGraphRework: false,
      shouldDisplayQuickActionCtas: false,
      shouldDisplayNewReceiveDialog: false,
      shouldDisplayWallet40MainNav: false,
      shouldUseLazyOnboarding: false,
    } as never);

    const { result, store } = renderHook(() =>
      useAnalyticsOptInPromptLogic({
        entryPoint: "Onboarding",
        variant: ABTestingVariants.variantA,
      }),
    );

    act(() => {
      result.current.continueOnboarding();
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingPostWelcomeSelection,
        params: {
          userHasDevice: true,
        },
      },
    });
    expect(mockTryTriggerPushNotificationDrawerAfterAction).not.toHaveBeenCalled();
    expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
    expect(mockedUpdateIdentify).toHaveBeenCalled();
  });

  it("navigates to portfolio and activates reborn state when lazy onboarding is enabled", () => {
    mockedUseWalletFeaturesConfig.mockReturnValue({
      isEnabled: true,
      shouldDisplayMarketBanner: false,
      shouldDisplayGraphRework: false,
      shouldDisplayQuickActionCtas: false,
      shouldDisplayNewReceiveDialog: false,
      shouldDisplayWallet40MainNav: false,
      shouldUseLazyOnboarding: true,
    } as never);

    const { result, store } = renderHook(
      () =>
        useAnalyticsOptInPromptLogic({
          entryPoint: "Onboarding",
          variant: ABTestingVariants.variantA,
        }),
      {
        overrideInitialState: state => ({
          ...state,
          settings: {
            ...state.settings,
            hasCompletedOnboarding: false,
            readOnlyModeEnabled: false,
            isReborn: null,
            onboardingHasDevice: null,
          },
        }),
      },
    );

    act(() => {
      result.current.continueOnboarding();
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Base, {
      screen: NavigatorName.Main,
      params: {
        screen: NavigatorName.Portfolio,
        params: {
          screen: NavigatorName.WalletTab,
        },
      },
    });
    expect(mockTryTriggerPushNotificationDrawerAfterAction).toHaveBeenCalledWith("onboarding");
    expect(store.getState().settings.hasSeenAnalyticsOptInPrompt).toBe(true);
    expect(store.getState().settings.hasCompletedOnboarding).toBe(true);
    expect(store.getState().settings.readOnlyModeEnabled).toBe(true);
    expect(store.getState().settings.isReborn).toBe(true);
    expect(store.getState().settings.onboardingHasDevice).toBe(false);
  });

  it("keeps onboarding path when Wallet40 is disabled even if lazyOnboarding param is true", () => {
    mockedUseWalletFeaturesConfig.mockReturnValue({
      isEnabled: false,
      shouldDisplayMarketBanner: false,
      shouldDisplayGraphRework: false,
      shouldDisplayQuickActionCtas: false,
      shouldDisplayNewReceiveDialog: false,
      shouldDisplayWallet40MainNav: false,
      shouldUseLazyOnboarding: false,
    } as never);

    const { result } = renderHook(() =>
      useAnalyticsOptInPromptLogic({
        entryPoint: "Onboarding",
        variant: ABTestingVariants.variantA,
      }),
    );

    act(() => {
      result.current.continueOnboarding();
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.BaseOnboarding, {
      screen: NavigatorName.Onboarding,
      params: {
        screen: ScreenName.OnboardingPostWelcomeSelection,
        params: {
          userHasDevice: true,
        },
      },
    });
  });
});
