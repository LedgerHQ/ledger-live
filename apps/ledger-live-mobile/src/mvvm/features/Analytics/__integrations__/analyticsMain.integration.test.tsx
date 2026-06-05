import React from "react";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
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
import type { Account } from "@ledgerhq/types-live";

const mockNavigate = jest.fn();

jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
  useAccountBridgeOrNull: jest.fn(),
  useAccountBridgeMany: jest.fn((accounts: Account[]) =>
    accounts.map(() => ({ isAccountEmpty: () => false })),
  ),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe("AnalyticsMain Integration Tests", () => {
  const swapTabRoute = {
    screen: NavigatorName.Swap,
    params: {
      screen: ScreenName.SwapTab,
      params: {},
    },
  };

  const mockState = (state: State, isExchangeEnabled: boolean = true): State => {
    const btcAccount = createMockAccount(mockBitcoinCurrency, "btc-1");
    const ethAccount = createMockAccount(mockEthereumCurrency, "eth-1");
    const adaAccount = createMockAccount(mockCardanoCurrency, "ada-1");

    return withFlagOverrides({
      ptxServiceCtaExchangeDrawer: { enabled: isExchangeEnabled },
      lwmWallet40: {
        enabled: true,
        params: { mainNavigation: true, aggregatedAssets: false },
      },
    })({
      ...state,
      accounts: {
        ...state.accounts,
        active: [btcAccount, ethAccount, adaAccount],
      },
    });
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

  it("should track and navigate to swap tab when swap button is pressed", async () => {
    const { user } = render(<TestNavigatorWrapper />, {
      overrideInitialState: mockState,
    });

    await user.press(screen.getByText(/swap/i));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "Swap",
      page: "Analytics",
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Main, swapTabRoute);
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
