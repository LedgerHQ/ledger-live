import React from "react";
import { render, screen } from "@tests/test-renderer";
import DetailedAllocation from "../screens/DetailedAllocation";
import { State } from "~/reducers/types";
import {
  createMockAccount,
  mockBitcoinCurrency,
  mockEthereumCurrency,
  mockCardanoCurrency,
  mockEthAccountWithUSDC,
  usdcToken,
} from "./shared";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe("DetailedAllocation Integration Tests", () => {
  const mockStateWithAccounts = (state: State): State => {
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
        counterValue: "USD",
      },
    };
  };

  const mockStateWithSingleAccount = (state: State): State => {
    const btcAccount = createMockAccount(mockBitcoinCurrency, "btc-1");

    return {
      ...state,
      accounts: {
        ...state.accounts,
        active: [btcAccount],
      },
      settings: {
        ...state.settings,
        counterValue: "USD",
      },
    };
  };

  const mockStateWithNoAccounts = (state: State): State => ({
    ...state,
    accounts: {
      ...state.accounts,
      active: [],
    },
    settings: {
      ...state.settings,
      counterValue: "USD",
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with multiple accounts and display all currencies", () => {
    render(<DetailedAllocation />, {
      overrideInitialState: mockStateWithAccounts,
    });

    expect(screen.getByText("3")).toBeVisible();
    expect(screen.getByText(/assets/i)).toBeVisible();
    expect(screen.getByText(/Bitcoin/i)).toBeVisible();
    expect(screen.getByText(/Ethereum/i)).toBeVisible();
    expect(screen.getByText(/Cardano/i)).toBeVisible();
  });

  it("should render with single account", () => {
    render(<DetailedAllocation />, {
      overrideInitialState: mockStateWithSingleAccount,
    });

    expect(screen.getByText("1")).toBeVisible();
  });

  it("should handle empty accounts state", () => {
    render(<DetailedAllocation />, {
      overrideInitialState: mockStateWithNoAccounts,
    });

    expect(screen.getByText("0")).toBeVisible();
  });

  it("should show percentage distribution for each asset", () => {
    render(<DetailedAllocation />, {
      overrideInitialState: mockStateWithAccounts,
    });

    const percentagePattern = /\d+%/;
    const percentages = screen.getAllByText(percentagePattern);
    expect(percentages.length).toBeGreaterThan(0);
  });

  describe("blacklisted tokens", () => {
    const mockStateWithBlacklistedToken = (state: State): State => ({
      ...state,
      accounts: { ...state.accounts, active: [mockEthAccountWithUSDC] },
      settings: { ...state.settings, counterValue: "USD", blacklistedTokenIds: [usdcToken.id] },
    });

    const mockStateWithNonBlacklistedToken = (state: State): State => ({
      ...state,
      accounts: { ...state.accounts, active: [mockEthAccountWithUSDC] },
      settings: { ...state.settings, counterValue: "USD", blacklistedTokenIds: [] },
    });

    it("should display a token that is not blacklisted", () => {
      render(<DetailedAllocation />, {
        overrideInitialState: mockStateWithNonBlacklistedToken,
      });

      expect(screen.getByText(usdcToken.name)).toBeVisible();
    });

    it("should not display a blacklisted token in the distribution list", () => {
      render(<DetailedAllocation />, {
        overrideInitialState: mockStateWithBlacklistedToken,
      });

      expect(screen.queryByText(usdcToken.name)).toBeNull();
    });
  });

  it("should track and navigate when distribution card is pressed", async () => {
    const { user } = render(<DetailedAllocation />, {
      overrideInitialState: mockStateWithAccounts,
    });

    await user.press(screen.getByText(/Bitcoin/i));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "View Account",
      page: "Detailed Allocation",
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
      screen: ScreenName.Asset,
      params: {
        currency: mockBitcoinCurrency,
      },
    });
  });
});
