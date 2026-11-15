import { track } from "@shared/analytics";
import React from "react";
import { render, screen } from "@tests/test-renderer";
import DetailedAllocation from "../screens/DetailedAllocation";
import { State } from "~/reducers/types";
import {
  createMockAccount,
  mockBitcoinCurrency,
  mockEthereumCurrency,
  mockCardanoCurrency,
  usdcToken,
} from "./shared";
import {
  createFixtureAccount,
  createFixtureTokenAccount,
} from "@ledgerhq/live-common/mock/fixtures/cryptoCurrencies";
import type { Account } from "@ledgerhq/types-live";

const createMockEthAccountWithUSDC = (): Account => {
  const ethAccount = createFixtureAccount("01");
  const usdcSubAccount = createFixtureTokenAccount("01", usdcToken);
  return {
    ...ethAccount,
    subAccounts: [{ ...usdcSubAccount, parentId: ethAccount.id }],
  };
};

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

  it("should render with multiple accounts and display all currencies", async () => {
    render(<DetailedAllocation />, {
      overrideInitialState: mockStateWithAccounts,
    });

    expect(await screen.findByText("3")).toBeVisible();
    expect(screen.getByText(/assets/i)).toBeVisible();
    expect(screen.getByText(/Bitcoin/i)).toBeVisible();
    expect(screen.getByText(/Ethereum/i)).toBeVisible();
    expect(screen.getByText(/Cardano/i)).toBeVisible();
  });

  it("should render with single account", async () => {
    render(<DetailedAllocation />, {
      overrideInitialState: mockStateWithSingleAccount,
    });

    expect(await screen.findByText("1")).toBeVisible();
  });

  it("should handle empty accounts state", () => {
    render(<DetailedAllocation />, {
      overrideInitialState: mockStateWithNoAccounts,
    });

    expect(screen.getByText("0")).toBeVisible();
  });

  it("should show percentage distribution for each asset", async () => {
    render(<DetailedAllocation />, {
      overrideInitialState: mockStateWithAccounts,
    });

    expect((await screen.findAllByText(/\d+%/)).length).toBeGreaterThan(0);
  });

  describe("blacklisted tokens", () => {
    const mockStateWithBlacklistedToken = (state: State): State => {
      const mockEthAccountWithUSDC = createMockEthAccountWithUSDC();
      return {
        ...state,
        accounts: { ...state.accounts, active: [mockEthAccountWithUSDC] },
        settings: { ...state.settings, counterValue: "USD", blacklistedTokenIds: [usdcToken.id] },
      };
    };
    const mockStateWithNonBlacklistedToken = (state: State): State => {
      const mockEthAccountWithUSDC = createMockEthAccountWithUSDC();
      return {
        ...state,
        accounts: { ...state.accounts, active: [mockEthAccountWithUSDC] },
        settings: { ...state.settings, counterValue: "USD", blacklistedTokenIds: [] },
      };
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should display a token that is not blacklisted", async () => {
      render(<DetailedAllocation />, {
        overrideInitialState: mockStateWithNonBlacklistedToken,
      });

      expect(await screen.findByText(usdcToken.name)).toBeVisible();
    });

    it("should not display a blacklisted token in the distribution list", async () => {
      render(<DetailedAllocation />, {
        overrideInitialState: mockStateWithBlacklistedToken,
      });

      expect(await screen.findByText(/Ethereum/i)).toBeVisible();
      expect(screen.queryByText(usdcToken.name)).toBeNull();
    });
  });

  it("should track and navigate when distribution card is pressed", async () => {
    const { user } = render(<DetailedAllocation />, {
      overrideInitialState: mockStateWithAccounts,
    });

    await user.press(await screen.findByText(/Bitcoin/i));

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "View Account",
      page: "Detailed Allocation",
    });

    expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.AssetDetail, {
      screen: ScreenName.AssetDetail,
      params: {
        currencyId: mockBitcoinCurrency.id,
        source: "detailed_allocation",
      },
    });
  });
});
