import React from "react";
import { render, screen } from "@tests/test-renderer";
import {
  TestNavigatorWrapper,
  createMockAccount,
  mockBitcoinCurrency,
  mockEthereumCurrency,
  mockCardanoCurrency,
} from "./shared";
import { State } from "~/reducers/types";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe("AnalyticsMain Integration Tests", () => {
  const mockState = (
    state: State,
    isExchangeEnabled: boolean = true,
    isWallet40MainNavigation: boolean = true,
  ): State => {
    const btcAccount = createMockAccount(mockBitcoinCurrency, "btc-1");
    const ethAccount = createMockAccount(mockEthereumCurrency, "eth-1");
    const adaAccount = createMockAccount(mockCardanoCurrency, "ada-1");

    return {
      ...state,
      accounts: {
        ...state.accounts,
        active: [btcAccount, ethAccount, adaAccount],
      },
      settings: {
        ...state.settings,
        overriddenFeatureFlags: {
          ptxServiceCtaExchangeDrawer: { enabled: isExchangeEnabled },
          lwmWallet40: { enabled: true, params: { mainNavigation: isWallet40MainNavigation } },
        },
      },
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should display asset allocation title", () => {
    render(<TestNavigatorWrapper />, {
      overrideInitialState: mockState,
    });

    expect(screen.getByText(/allocation/i)).toBeVisible();
  });

  it("should display swap button", () => {
    render(<TestNavigatorWrapper />, {
      overrideInitialState: mockState,
    });

    expect(screen.getByText(/swap/i)).toBeVisible();
  });

  it("should not display swap button if exchange is disabled", () => {
    render(<TestNavigatorWrapper />, {
      overrideInitialState: state => mockState(state, false),
    });

    expect(screen.queryByText(/swap/i)).toBeNull();
  });

  it("should track and navigate to swap when swap button is pressed", async () => {
    const { user } = render(<TestNavigatorWrapper />, {
      overrideInitialState: state => mockState(state, true, false),
    });

    await user.press(screen.getByText(/swap/i));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Swap",
      page: "Analytics",
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Swap);
  });

  it("should navigate to swap tab bar screen when swap button is pressed and Wallet40 main navigation is enabled", async () => {
    const { user } = render(<TestNavigatorWrapper />, {
      overrideInitialState: state => mockState(state, true),
    });

    await user.press(screen.getByText(/swap/i));

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Main, {
      screen: NavigatorName.Swap,
    });
  });

  it("should track and navigate to detailed allocation when allocation component is pressed", async () => {
    const { user } = render(<TestNavigatorWrapper />, {
      overrideInitialState: mockState,
    });

    await user.press(screen.getByText(/BTC/i));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Detailed Allocation",
      page: "Analytics",
    });

    expect(mockNavigate).toHaveBeenCalledWith(ScreenName.DetailedAllocation, {
      sourceScreenName: NavigatorName.Analytics,
    });
  });
});
