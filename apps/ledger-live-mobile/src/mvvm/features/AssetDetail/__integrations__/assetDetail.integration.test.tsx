import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, waitFor, within } from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { Account } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import AssetDetailNavigator from "../Navigator";
import { ASSET_DETAIL_TEST_IDS } from "../testIds";
import { QUICK_ACTIONS_TEST_IDS } from "LLM/features/QuickActions/testIds";

const mockIsCurrencyAvailable = jest.fn().mockReturnValue(false);
const mockIsAcceptedCurrency = jest.fn().mockReturnValue(false);

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ isCurrencyAvailable: mockIsCurrencyAvailable }),
}));

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => mockIsAcceptedCurrency,
}));

// useAccountBridgeMany suspends on the dynamic coin-module import — bypass it
// so tests don't need a Suspense boundary and don't depend on import resolution timing.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
  useAccountBridgeOrNull: jest.fn(),
  useAccountBridgeMany: jest.fn((accounts: Account[]) =>
    accounts.map(() => ({ isAccountEmpty: () => false })),
  ),
}));

const Stack = createNativeStackNavigator();

type NavigatorParams = {
  currencyId: string;
  source?: string;
  marketState?: { id: string; ledgerIds?: string[] };
};

function AssetDetailTestNavigator({
  params = { currencyId: "bitcoin" },
}: {
  params?: NavigatorParams;
} = {}) {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={NavigatorName.AssetDetail}
        component={AssetDetailNavigator}
        initialParams={{
          screen: ScreenName.AssetDetail,
          params,
        }}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function withAccounts(
  accounts: { seed: string; currencyId: string; balance?: number; operationsSize?: number }[],
) {
  return {
    overrideInitialState: (state: State): State => ({
      ...state,
      accounts: {
        ...state.accounts,
        active: accounts.map(({ seed, currencyId, balance, operationsSize = 0 }) => {
          const currency = getCryptoCurrencyById(currencyId);
          const account = genAccount(seed, { currency, operationsSize });
          if (balance !== undefined) {
            account.balance = account.balance.times(0).plus(balance);
          }
          return account;
        }),
      },
    }),
  };
}

function withBtcAccounts(count: number, operationsSize = 0) {
  return withAccounts(
    Array.from({ length: count }, (_, i) => ({
      seed: `bitcoin-${i}`,
      currencyId: "bitcoin",
      operationsSize,
      balance: 100_000_000,
    })),
  );
}

function withBlacklistedTokens(tokenIds: string[]) {
  return {
    overrideInitialState: (state: State): State => ({
      ...state,
      settings: { ...state.settings, blacklistedTokenIds: tokenIds },
    }),
  };
}

describe("AssetDetail screen layout", () => {
  beforeEach(() => {
    mockIsCurrencyAvailable.mockReturnValue(false);
    mockIsAcceptedCurrency.mockReturnValue(false);
  });

  it("renders all section placeholders and BalanceGraph", () => {
    render(<AssetDetailTestNavigator />);

    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.screen)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.balanceGraph)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.marketStats)).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.coinOptionsTrailing)).toBeVisible();
    expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.transactions)).toBeNull();
  });

  it("hides balance details when there are no accounts", () => {
    render(<AssetDetailTestNavigator />);
    expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.balanceDetails)).toBeNull();
  });

  it("renders balance details with transfer button when accounts exist", async () => {
    render(<AssetDetailTestNavigator />, withBtcAccounts(2));
    await waitFor(() =>
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.balanceDetails)).toBeVisible(),
    );
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.totalBalance)).toBeVisible();
    const transferButton = screen.getByTestId(ASSET_DETAIL_TEST_IDS.transferButton);
    expect(transferButton).toBeVisible();
    expect(screen.getByText("Total balance")).toBeVisible();
    expect(within(transferButton).getByText("Transfer")).toBeVisible();
  });

  it("opens the transfer drawer on the asset detail screen when the transfer button is pressed", async () => {
    const { user } = render(<AssetDetailTestNavigator />, withBtcAccounts(2));

    const transferButton = await screen.findByTestId(ASSET_DETAIL_TEST_IDS.transferButton);
    await user.press(transferButton);

    await waitFor(() => {
      expect(screen.getByTestId(QUICK_ACTIONS_TEST_IDS.transferDrawer.container)).toBeVisible();
    });
  });

  it("renders the BalanceGraph chart", () => {
    render(<AssetDetailTestNavigator />);

    // While market data is loading, the header is rendered as a skeleton (no
    // "Market price" text). The chart container is still mounted.
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.chart)).toBeVisible();
    expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.receiveButton)).toBeNull();
  });

  it("hides the addresses section when there are no accounts", () => {
    render(<AssetDetailTestNavigator />);

    expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.addresses)).toBeNull();
  });

  it("renders the addresses section when accounts exist", async () => {
    render(<AssetDetailTestNavigator />, withBtcAccounts(2));

    await waitFor(() => expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.addresses)).toBeVisible());
    const section = screen.getByTestId(ASSET_DETAIL_TEST_IDS.addresses);
    expect(within(section).getByText("Addresses")).toBeVisible();
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.addAccount)).toBeVisible();
    expect(screen.getByText("Add")).toBeVisible();
  });

  it("hides the See all addresses button when 5 or fewer accounts exist", async () => {
    render(<AssetDetailTestNavigator />, withBtcAccounts(5));

    await waitFor(() => expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.addresses)).toBeVisible());
    expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.seeAllAddresses)).toBeNull();
  });

  it("does not render the addresses count when 5 or fewer accounts exist", async () => {
    render(<AssetDetailTestNavigator />, withBtcAccounts(5));

    await waitFor(() => expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.addresses)).toBeVisible());
    expect(screen.queryByText("(5)")).toBeNull();
  });

  it("caps the addresses preview at 5 items and shows See all when 6+ accounts exist", async () => {
    render(<AssetDetailTestNavigator />, withBtcAccounts(6));

    await waitFor(() =>
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.seeAllAddresses)).toBeVisible(),
    );
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.addresses)).toBeVisible();
    expect(screen.getByText("See all")).toBeVisible();
  });

  it("renders the total addresses count next to the title when 6+ accounts exist", async () => {
    render(<AssetDetailTestNavigator />, withBtcAccounts(8));

    await waitFor(() => expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.addresses)).toBeVisible());
    const header = screen.getByTestId(ASSET_DETAIL_TEST_IDS.addressesHeader);
    expect(within(header).getByText("(8)")).toBeVisible();
  });

  it("hides the transactions section when there are no operations", () => {
    render(<AssetDetailTestNavigator />, withBtcAccounts(2, 0));

    expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.transactions)).toBeNull();
  });

  it("renders the transactions section when operations exist", async () => {
    render(<AssetDetailTestNavigator />, withBtcAccounts(1, 5));

    await waitFor(() =>
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.transactions)).toBeVisible(),
    );
    expect(screen.getByText("Transactions")).toBeVisible();
  });

  describe("floating bar CTAs", () => {
    it("shows Receive button when wallet has no funds (no Buy, no Swap)", () => {
      render(<AssetDetailTestNavigator />);

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.ctas)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.footerReceiveButton)).toBeVisible();
      expect(screen.getByText("Receive")).toBeVisible();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.buyButton)).toBeNull();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.swapButton)).toBeNull();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.fallbackBanner)).toBeNull();
    });

    it("shows Buy + Receive when Buy is available but wallet has no funds", () => {
      mockIsCurrencyAvailable.mockReturnValue(true);

      render(<AssetDetailTestNavigator />);

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.ctas)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.buyButton)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.footerReceiveButton)).toBeVisible();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.swapButton)).toBeNull();
    });

    it("shows Buy + Swap when Buy available and asset has funds with swap available", () => {
      mockIsCurrencyAvailable.mockReturnValue(true);
      mockIsAcceptedCurrency.mockReturnValue(true);

      render(
        <AssetDetailTestNavigator />,
        withAccounts([{ seed: "btc-0", currencyId: "bitcoin", balance: 1000 }]),
      );

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.ctas)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.buyButton)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.swapButton)).toBeVisible();
      expect(screen.getByText("Swap")).toBeVisible();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.footerReceiveButton)).toBeNull();
    });

    it("shows only Buy when wallet has funds but swap is unavailable", () => {
      mockIsCurrencyAvailable.mockReturnValue(true);

      render(
        <AssetDetailTestNavigator />,
        withAccounts([{ seed: "btc-0", currencyId: "bitcoin", balance: 1000 }]),
      );

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.ctas)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.buyButton)).toBeVisible();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.swapButton)).toBeNull();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.footerReceiveButton)).toBeNull();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.fallbackBanner)).toBeNull();
    });

    it("shows fallback banner instead of floating bar when wallet has funds but Buy and Swap both unavailable", () => {
      render(
        <AssetDetailTestNavigator />,
        withAccounts([{ seed: "btc-0", currencyId: "bitcoin", balance: 1000 }]),
      );

      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.ctas)).toBeNull();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.fallbackBanner)).toBeVisible();
      expect(screen.getByText("Swap and Buy are not supported for this asset.")).toBeVisible();
    });

    it("shows Swap when another asset has funds and swap is available (no Buy)", () => {
      mockIsAcceptedCurrency.mockReturnValue(true);

      render(
        <AssetDetailTestNavigator />,
        withAccounts([{ seed: "eth-0", currencyId: "ethereum", balance: 500 }]),
      );

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.ctas)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.swapButton)).toBeVisible();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.buyButton)).toBeNull();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.fallbackBanner)).toBeNull();
    });

    it("hides BalanceGraph Receive when footer shows Receive (no funds)", () => {
      render(<AssetDetailTestNavigator />);

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.footerReceiveButton)).toBeVisible();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.receiveButton)).toBeNull();
    });

    it("shows BalanceGraph Receive when footer shows Swap (funds elsewhere)", () => {
      mockIsAcceptedCurrency.mockReturnValue(true);

      render(
        <AssetDetailTestNavigator />,
        withAccounts([{ seed: "eth-0", currencyId: "ethereum", balance: 500 }]),
      );

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.swapButton)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.receiveButton)).toBeVisible();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.footerReceiveButton)).toBeNull();
    });
  });

  describe("hidden asset banner", () => {
    it("does not render the banner when the asset is not hidden", () => {
      render(<AssetDetailTestNavigator />);

      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.hiddenAssetBanner)).toBeNull();
    });

    it("renders the banner when the asset is blacklisted", () => {
      render(<AssetDetailTestNavigator />, withBlacklistedTokens(["bitcoin"]));

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.hiddenAssetBanner)).toBeVisible();
      expect(screen.getByText("This asset is hidden from your portfolio.")).toBeVisible();
      expect(screen.getByText("Show asset")).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.hiddenAssetBannerShowAsset)).toBeVisible();
    });

    it("hides the banner and unhides the asset when Show asset is pressed", async () => {
      const { user, store } = render(
        <AssetDetailTestNavigator />,
        withBlacklistedTokens(["bitcoin"]),
      );

      const showAssetButton = await screen.findByTestId(
        ASSET_DETAIL_TEST_IDS.hiddenAssetBannerShowAsset,
      );
      await user.press(showAssetButton);

      await waitFor(() =>
        expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.hiddenAssetBanner)).toBeNull(),
      );
      expect(store.getState().settings.blacklistedTokenIds).not.toContain("bitcoin");
    });
  });

  describe("market-origin navigation (marketState)", () => {
    it("renders the screen when navigated from Market with a marketState hint", async () => {
      render(
        <AssetDetailTestNavigator
          params={{
            currencyId: "binancecoin",
            source: "market_banner",
            marketState: { id: "binancecoin", ledgerIds: ["bsc"] },
          }}
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.screen)).toBeVisible();
      });
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.balanceGraph)).toBeVisible();
    });
  });
});
