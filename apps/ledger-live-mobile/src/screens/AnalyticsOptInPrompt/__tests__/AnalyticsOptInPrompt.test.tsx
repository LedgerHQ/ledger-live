import React from "react";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { StackActions, useNavigation } from "@react-navigation/native";
import AnalyticsOptInPromptMain from "~/screens/AnalyticsOptInPrompt/variantA/Main";
import { NavigatorName, ScreenName } from "~/const";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: jest.fn(),
  };
});

jest.mock("LLM/features/NotificationsPrompt", () => ({
  useNotificationsContext: () => ({
    notifyFlowCompleted: jest.fn(),
    tryTriggerPushNotificationDrawerAfterInactivity: jest.fn(),
  }),
}));

const mockedUseNavigation = jest.mocked(useNavigation);

const mockNavigate = jest.fn();
const mockParentDispatch = jest.fn();
const mockAddListener = jest.fn();

const renderAnalyticsOptInMain = ({
  wallet40Enabled,
  lazyOnboarding,
  notificationsOptInEnabled = false,
}: {
  wallet40Enabled: boolean;
  lazyOnboarding?: boolean;
  notificationsOptInEnabled?: boolean;
}) =>
  render(
    <AnalyticsOptInPromptMain
      route={{ params: { entryPoint: "Onboarding" } } as never}
      navigation={{ addListener: mockAddListener } as never}
    />,
    {
      overrideInitialState: withFlagOverrides({
        lwmWallet40: {
          enabled: wallet40Enabled,
          params: {
            lazyOnboarding,
          },
        },
        lwmNotificationsOptIn: {
          enabled: notificationsOptInEnabled,
        },
      }),
    },
  );

describe("AnalyticsOptInPrompt", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseNavigation.mockReturnValue({
      navigate: mockNavigate,
      getParent: jest.fn(() => ({
        dispatch: mockParentDispatch,
      })),
    });
  });

  it("navigates to onboarding device selection when lazy onboarding is disabled", async () => {
    const { user } = renderAnalyticsOptInMain({ wallet40Enabled: true, lazyOnboarding: false });

    await user.press(screen.getByTestId("enabled-accept-analytics-button"));

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

  it("navigates to portfolio when lazy onboarding is enabled", async () => {
    const { user } = await renderAnalyticsOptInMain({
      wallet40Enabled: true,
      lazyOnboarding: true,
    });

    await user.press(screen.getByTestId("enabled-accept-analytics-button"));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Base, {
      screen: NavigatorName.Main,
      params: {
        screen: NavigatorName.Portfolio,
        params: {
          screen: NavigatorName.WalletTab,
        },
      },
    });
  });

  it("navigates to notifications opt-in when lazy onboarding and notifications opt-in are enabled", async () => {
    const { user } = await renderAnalyticsOptInMain({
      wallet40Enabled: true,
      lazyOnboarding: true,
      notificationsOptInEnabled: true,
    });

    await user.press(screen.getByTestId("enabled-accept-analytics-button"));

    expect(mockParentDispatch).toHaveBeenCalledWith(
      StackActions.push(ScreenName.OnboardingNotificationsOptIn),
    );
  });

  it("keeps onboarding path when Wallet40 is disabled even with lazyOnboarding enabled", async () => {
    const { user } = await renderAnalyticsOptInMain({
      wallet40Enabled: false,
      lazyOnboarding: true,
    });

    await user.press(screen.getByTestId("enabled-accept-analytics-button"));

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
