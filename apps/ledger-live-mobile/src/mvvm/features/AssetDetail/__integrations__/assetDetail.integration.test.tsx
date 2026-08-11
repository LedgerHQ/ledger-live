import React from "react";
import type { CurrencyResult } from "@features/platform-currencies";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  render,
  renderWithReactQuery,
  screen,
  waitFor,
  within,
  withFlagOverrides,
} from "@tests/test-renderer";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { findCryptoCurrencyById, getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import type { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { BASE_NAVIGATOR_ID, NavigatorName, ScreenName } from "~/const";
import type { State } from "~/reducers/types";
import MarketList from "LLM/features/Market/screens/MarketList";
import AssetDetailNavigator from "../Navigator";
import { ASSET_DETAIL_TEST_IDS } from "../testIds";
import { QUICK_ACTIONS_TEST_IDS } from "LLM/features/QuickActions/testIds";
import {
  useReceiveNetworkLedgerIds,
  useTradeAvailability,
  type TradeAvailability,
} from "@ledgerhq/asset-detail";

const mockIsCurrencyAvailable = jest.fn().mockReturnValue(false);
const mockIsAcceptedCurrency = jest.fn().mockReturnValue(false);
const mockUseCurrencyById = jest.fn<CurrencyResult, [string]>();
type TokenCurrency = Extract<NonNullable<CurrencyResult["currency"]>, { type: "TokenCurrency" }>;

jest.mock("@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog", () => ({
  useRampCatalog: () => ({ isCurrencyAvailable: mockIsCurrencyAvailable }),
}));

jest.mock("@ledgerhq/live-common/modularDrawer/hooks/useAcceptedCurrency", () => ({
  useAcceptedCurrency: () => mockIsAcceptedCurrency,
}));

jest.mock("@features/platform-currencies", () => ({
  ...jest.requireActual("@features/platform-currencies"),
  useCurrencyById: (id: string) => mockUseCurrencyById(id),
}));

jest.mock("@ledgerhq/asset-detail", () => ({
  ...jest.requireActual("@ledgerhq/asset-detail"),
  useTradeAvailability: jest.fn(),
  useReceiveNetworkLedgerIds: jest.fn(),
}));

const mockedUseTradeAvailability = jest.mocked(useTradeAvailability);
const mockedUseReceiveNetworkLedgerIds = jest.mocked(useReceiveNetworkLedgerIds);
const setAvailability = (overrides: Partial<TradeAvailability> = {}) =>
  mockedUseTradeAvailability.mockReturnValue({
    availableOnBuy: true,
    availableOnSell: true,
    availableOnSwap: true,
    isCurrencySupported: true,
    isResolved: true,
    ...overrides,
  } as TradeAvailability);

// useAccountBridgeMany suspends on the dynamic coin-module import — bypass it
// so tests don't need a Suspense boundary and don't depend on import resolution timing.
jest.mock("@ledgerhq/live-common/bridge/useAccountBridge", () => ({
  useAccountBridge: jest.fn(),
  useAccountBridgeOrNull: jest.fn(),
  useAccountBridgeMany: jest.fn((accounts: Account[]) =>
    accounts.map(() => ({ isAccountEmpty: () => false })),
  ),
}));

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

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
    <Stack.Navigator id={BASE_NAVIGATOR_ID}>
      <Stack.Screen
        name={NavigatorName.AssetDetail}
        component={AssetDetailNavigator}
        initialParams={{
          screen: ScreenName.AssetDetail,
          params,
        }}
        options={{ headerShown: false }}
      />
      <Stack.Screen name={ScreenName.MarketList} component={MarketList} />
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
    mockUseCurrencyById.mockReset();
    mockUseCurrencyById.mockImplementation((id: string) => ({
      currency: findCryptoCurrencyById(id),
      loading: false,
      error: undefined,
    }));
    mockIsCurrencyAvailable.mockReturnValue(false);
    mockIsAcceptedCurrency.mockReturnValue(false);
    setAvailability();
    // Default passthrough: the receive network list resolves to the market fallback.
    mockedUseReceiveNetworkLedgerIds.mockImplementation(
      ({ fallbackLedgerIds }) => fallbackLedgerIds ?? [],
    );
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
    expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.receiveButton)).toBeVisible();
  });

  it("hides the addresses section when there are no accounts", () => {
    render(<AssetDetailTestNavigator />);

    expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.addresses)).toBeNull();
  });

  it("renders the addresses section when accounts exist", async () => {
    render(<AssetDetailTestNavigator />, withBtcAccounts(2));

    await waitFor(() => expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.addresses)).toBeVisible());
    const section = screen.getByTestId(ASSET_DETAIL_TEST_IDS.addresses);
    expect(within(section).getByText("Accounts")).toBeVisible();
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

  describe("empty accounts", () => {
    it("renders the addresses section when only an empty account exists", async () => {
      render(
        <AssetDetailTestNavigator />,
        withAccounts([{ seed: "bitcoin-empty-0", currencyId: "bitcoin", balance: 0 }]),
      );

      await waitFor(() =>
        expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.addresses)).toBeVisible(),
      );
    });

    it("includes empty accounts alongside funded ones in the addresses count", async () => {
      render(
        <AssetDetailTestNavigator />,
        withAccounts([
          { seed: "bitcoin-funded-0", currencyId: "bitcoin", balance: 100_000_000 },
          { seed: "bitcoin-funded-1", currencyId: "bitcoin", balance: 100_000_000 },
          { seed: "bitcoin-funded-2", currencyId: "bitcoin", balance: 100_000_000 },
          { seed: "bitcoin-empty-0", currencyId: "bitcoin", balance: 0 },
          { seed: "bitcoin-empty-1", currencyId: "bitcoin", balance: 0 },
          { seed: "bitcoin-empty-2", currencyId: "bitcoin", balance: 0 },
        ]),
      );

      await waitFor(() =>
        expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.addresses)).toBeVisible(),
      );
      const header = screen.getByTestId(ASSET_DETAIL_TEST_IDS.addressesHeader);
      expect(within(header).getByText("(6)")).toBeVisible();
    });
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
    it("shows Buy + Swap in the footer and hides graph Receive when the asset has an account", () => {
      setAvailability({ availableOnBuy: true, availableOnSwap: true });

      render(
        <AssetDetailTestNavigator />,
        withAccounts([{ seed: "btc-0", currencyId: "bitcoin", balance: 1000 }]),
      );

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.ctas)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.buyButton)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.swapButton)).toBeVisible();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.footerReceiveButton)).toBeNull();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.receiveButton)).toBeNull();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.fallbackBanner)).toBeNull();
    });

    it("shows Buy + Swap in the footer and Receive in the graph when the asset has no account", () => {
      setAvailability({ availableOnBuy: true, availableOnSwap: true });

      render(<AssetDetailTestNavigator />);

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.buyButton)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.swapButton)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.receiveButton)).toBeVisible();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.footerReceiveButton)).toBeNull();
    });

    it("shows graph Receive and the fallback banner when supported but neither buyable nor swappable", () => {
      setAvailability({ availableOnBuy: false, availableOnSwap: false });

      render(<AssetDetailTestNavigator />);

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.receiveButton)).toBeVisible();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.footerReceiveButton)).toBeNull();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.buyButton)).toBeNull();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.swapButton)).toBeNull();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.fallbackBanner)).toBeVisible();
      expect(screen.getByText("Swap and Buy are not supported for this asset.")).toBeVisible();
    });

    it("hides every CTA and the banner when the currency is not supported (view-only)", () => {
      setAvailability({
        isCurrencySupported: false,
        availableOnBuy: false,
        availableOnSwap: false,
      });

      render(
        <AssetDetailTestNavigator />,
        withAccounts([{ seed: "btc-0", currencyId: "bitcoin", balance: 1000 }]),
      );

      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.ctas)).toBeNull();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.footerReceiveButton)).toBeNull();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.receiveButton)).toBeNull();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.fallbackBanner)).toBeNull();
    });

    it("shows the BalanceGraph Receive when the asset has no account and no footer CTA", () => {
      setAvailability({ availableOnBuy: false, availableOnSwap: false });

      render(<AssetDetailTestNavigator />);

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.receiveButton)).toBeVisible();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.footerReceiveButton)).toBeNull();
    });

    it("shows the BalanceGraph Receive when the footer shows Swap and only another asset has an account", () => {
      setAvailability({ availableOnSwap: true });

      render(
        <AssetDetailTestNavigator />,
        withAccounts([{ seed: "eth-0", currencyId: "ethereum", balance: 500 }]),
      );

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.swapButton)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.receiveButton)).toBeVisible();
      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.footerReceiveButton)).toBeNull();
    });

    it("hides the BalanceGraph Receive when the asset account exists without funds", () => {
      setAvailability({ availableOnBuy: true, availableOnSwap: true });

      render(
        <AssetDetailTestNavigator />,
        withAccounts([{ seed: "btc-0", currencyId: "bitcoin", balance: 0 }]),
      );

      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.receiveButton)).toBeNull();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.ctas)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.buyButton)).toBeVisible();
      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.swapButton)).toBeVisible();
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

  describe("Robinhood stock disclaimer banner", () => {
    const ROBINHOOD_ONLY_LEDGER_IDS = [
      "robinhood_testnet/erc20/amd_0x71178bac73cbeb415514eb542a8995b82669778d",
    ];
    // Enables the flag and funds the asset, so only the Robinhood-exclusivity gate is exercised.
    const enableDisclaimer = () => ({
      overrideInitialState: withFlagOverrides(
        { llRobinhoodDisclaimer: { enabled: true } },
        withBtcAccounts(1).overrideInitialState,
      ),
    });

    it("shows the disclaimer banner when the flag is on, the balance is positive and the asset is exclusive to a Robinhood chain", async () => {
      mockedUseReceiveNetworkLedgerIds.mockReturnValue(ROBINHOOD_ONLY_LEDGER_IDS);

      render(<AssetDetailTestNavigator />, enableDisclaimer());

      await waitFor(() =>
        expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.stockDisclaimerBanner)).toBeVisible(),
      );
      expect(
        screen.getByText("Total balance does not include dividends or stock splits."),
      ).toBeVisible();
    });

    it("hides the disclaimer banner for a multi-network asset that also lives on Robinhood", () => {
      mockedUseReceiveNetworkLedgerIds.mockReturnValue([
        "ethereum/erc20/weth_0x0bd7d308f8e1639fab988df18a8011f41eacad73",
        "robinhood/erc20/weth_0x0bd7d308f8e1639fab988df18a8011f41eacad73",
      ]);

      render(<AssetDetailTestNavigator />, enableDisclaimer());

      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.stockDisclaimerBanner)).toBeNull();
    });

    it("hides the disclaimer banner for a standard single-chain asset", () => {
      mockedUseReceiveNetworkLedgerIds.mockReturnValue(["bitcoin"]);

      render(<AssetDetailTestNavigator />, enableDisclaimer());

      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.stockDisclaimerBanner)).toBeNull();
    });

    it("hides the disclaimer banner when the flag is off, even for a Robinhood-exclusive asset", () => {
      mockedUseReceiveNetworkLedgerIds.mockReturnValue(ROBINHOOD_ONLY_LEDGER_IDS);

      render(<AssetDetailTestNavigator />);

      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.stockDisclaimerBanner)).toBeNull();
    });

    it("hides the disclaimer banner when the asset has no balance", () => {
      mockedUseReceiveNetworkLedgerIds.mockReturnValue(ROBINHOOD_ONLY_LEDGER_IDS);

      render(<AssetDetailTestNavigator />, {
        overrideInitialState: withFlagOverrides({ llRobinhoodDisclaimer: { enabled: true } }),
      });

      expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.stockDisclaimerBanner)).toBeNull();
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

    it.each(["deeplink_asset", "deeplink_market"])(
      "redirects a missing token %s deeplink to Market",
      async source => {
        const tokenId = "ethereum/erc20/does_not_exist";
        mockUseCurrencyById.mockReturnValue({
          currency: undefined,
          loading: false,
          error: undefined,
        });

        renderWithReactQuery(
          <AssetDetailTestNavigator
            params={{
              currencyId: tokenId,
              source,
              marketState: { id: tokenId, ledgerIds: [tokenId] },
            }}
          />,
        );

        await waitFor(() => expect(screen.getByTestId("market-list")).toBeVisible());
        expect(screen.queryByTestId(ASSET_DETAIL_TEST_IDS.screen)).toBeNull();
      },
    );

    it("keeps a valid token deeplink on Asset Detail", () => {
      const token = {
        type: "TokenCurrency",
        id: "ethereum/erc20/usd-tether" as TokenCurrency["id"],
        parentCurrencyId: "ethereum" as TokenCurrency["parentCurrencyId"],
        contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        tokenType: "erc20",
        name: "Tether USD",
        ticker: "USDT",
        units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
      } satisfies TokenCurrency;
      mockUseCurrencyById.mockReturnValue({
        currency: token,
        loading: false,
        error: undefined,
      });

      render(
        <AssetDetailTestNavigator
          params={{
            currencyId: token.id,
            source: "deeplink_asset",
            marketState: { id: token.id, ledgerIds: [token.id] },
          }}
        />,
      );

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.screen)).toBeVisible();
      expect(screen.queryByTestId("market-list")).toBeNull();
    });

    it("keeps Asset Detail visible while the token lookup is loading", () => {
      const tokenId = "ethereum/erc20/loading";
      mockUseCurrencyById.mockReturnValue({
        currency: undefined,
        loading: true,
        error: undefined,
      });

      render(
        <AssetDetailTestNavigator
          params={{
            currencyId: tokenId,
            source: "deeplink_asset",
            marketState: { id: tokenId, ledgerIds: [tokenId] },
          }}
        />,
      );

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.screen)).toBeVisible();
      expect(screen.queryByTestId("market-list")).toBeNull();
    });

    it("keeps the Asset Detail screen on token lookup errors", () => {
      const tokenId = "ethereum/erc20/unavailable";
      mockUseCurrencyById.mockReturnValue({
        currency: undefined,
        loading: false,
        error: new Error("CAL unavailable"),
      });

      render(
        <AssetDetailTestNavigator
          params={{
            currencyId: tokenId,
            source: "deeplink_market",
            marketState: { id: tokenId, ledgerIds: [tokenId] },
          }}
        />,
      );

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.screen)).toBeVisible();
      expect(screen.queryByTestId("market-list")).toBeNull();
    });

    it("keeps market-only assets on Asset Detail outside deeplinks", () => {
      mockUseCurrencyById.mockReturnValue({
        currency: undefined,
        loading: false,
        error: undefined,
      });

      render(
        <AssetDetailTestNavigator
          params={{
            currencyId: "market-only-asset",
            source: "market_banner",
            marketState: { id: "market-only-asset" },
          }}
        />,
      );

      expect(screen.getByTestId(ASSET_DETAIL_TEST_IDS.screen)).toBeVisible();
      expect(screen.queryByTestId("market-list")).toBeNull();
    });
  });
});
