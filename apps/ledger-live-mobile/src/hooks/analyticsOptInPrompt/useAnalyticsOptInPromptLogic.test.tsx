import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { useNavigation } from "@react-navigation/native";
import AnalyticsOptInPromptMain from "~/screens/AnalyticsOptInPrompt/variantA/Main";
import { NavigatorName, ScreenName } from "~/const";
import { State } from "~/reducers/types";

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  return {
    ...actual,
    useNavigation: jest.fn(),
  };
});

const mockedUseNavigation = jest.mocked(useNavigation);

const mockNavigate = jest.fn();
const mockAddListener = jest.fn();

const renderAnalyticsOptInMain = ({
  wallet40Enabled,
  lazyOnboarding,
}: {
  wallet40Enabled: boolean;
  lazyOnboarding?: boolean;
}) =>
  render(
    <AnalyticsOptInPromptMain
      route={{ params: { entryPoint: "Onboarding" } } as never}
      navigation={{ addListener: mockAddListener } as never}
    />,
    {
      overrideInitialState: (state: State) => ({
        ...state,
        settings: {
          ...state.settings,
          overriddenFeatureFlags: {
            ...state.settings.overriddenFeatureFlags,
            lwmWallet40: {
              enabled: wallet40Enabled,
              params: {
                lazyOnboarding,
              },
            },
          },
        },
      }),
    },
  );

describe("useAnalyticsOptInPromptLogic", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseNavigation.mockReturnValue({ navigate: mockNavigate });
  });

  it("navigates to onboarding device selection when lazy onboarding is disabled", async () => {
    const { user } = renderAnalyticsOptInMain({ wallet40Enabled: true, lazyOnboarding: false });

    await user.press(screen.getByTestId("accept-analytics-button"));

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

    await user.press(screen.getByTestId("accept-analytics-button"));

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

  it("keeps onboarding path when Wallet40 is disabled even with lazyOnboarding enabled", async () => {
    const { user } = await renderAnalyticsOptInMain({
      wallet40Enabled: false,
      lazyOnboarding: true,
    });

    await user.press(screen.getByTestId("accept-analytics-button"));

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
