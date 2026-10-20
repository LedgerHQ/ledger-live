import { renderHook, act, withFlagOverrides } from "tests/testSetup";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { usdcToken } from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { getAccountUrl } from "~/renderer/utils/accountUrl";
import { getAccountsSidebarPath } from "LLD/components/SideBar/utils";
import { useAddressListViewModel } from "../useAddressListViewModel";
import { buildDistributionItem } from "tests/utils/distributionTestUtils";
import { ETH_ACCOUNT } from "LLD/features/__mocks__/accounts.mock";
import { MAX_ADDRESSES_PREVIEW } from "../../constants";
import { BigNumber } from "bignumber.js";
import { buildCV } from "@domain/entity-market-countervalues/mock";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { countervaluesInitialState } from "@features/platform-market-countervalues";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/asset/bitcoin" }),
}));

const mockOpenAddAccountFlow = jest.fn();
const mockOpenAssetFlow = jest.fn();

/** Stubs the add-account flow so this suite does not load the full drawer/modal dependency graph. */
jest.mock("LLD/features/ModularDialog/hooks/useOpenAssetFlow", () => ({
  useOpenAssetFlow: () => ({
    openAddAccountFlow: mockOpenAddAccountFlow,
    openAssetFlow: mockOpenAssetFlow,
  }),
}));

const mockNetworkLedgerIds = jest.fn<string[], []>(() => []);

/** Stubs the DADA network resolution so this suite does not hit the assets catalog. */
jest.mock("LLD/features/AssetDetail/hooks/useReceiveNetworkLedgerIds", () => ({
  useReceiveNetworkLedgerIds: () => mockNetworkLedgerIds(),
}));

describe("useAddressListViewModel", () => {
  const btc = getCryptoCurrencyById("bitcoin");

  beforeEach(() => {
    mockNavigate.mockClear();
    mockOpenAddAccountFlow.mockClear();
    mockOpenAssetFlow.mockClear();
    mockNetworkLedgerIds.mockReturnValue([]);
  });

  it("exposes address section labels", () => {
    const { result } = renderHook(() =>
      useAddressListViewModel(buildDistributionItem({ currency: btc, accounts: [] })),
    );

    expect(result.current.sectionTitle).toBe("Accounts");
    expect(result.current.sectionActionLabel).toBe("Add");
    expect(result.current.shouldShowSeeAll).toBe(false);
    expect(result.current.previewAccounts).toEqual([]);
  });

  it("previews only 5 accounts and offers See all when there are more than 5", () => {
    const accounts = Array.from({ length: MAX_ADDRESSES_PREVIEW + 1 }, (_, index) =>
      genAccount(`asset-detail-address-preview-${index}`, { currency: btc }),
    );

    const { result } = renderHook(() =>
      useAddressListViewModel(buildDistributionItem({ currency: btc, accounts })),
    );

    expect(result.current.shouldShowSeeAll).toBe(true);
    expect(result.current.addressCount).toBe(MAX_ADDRESSES_PREVIEW + 1);
    expect(result.current.previewAccounts).toHaveLength(MAX_ADDRESSES_PREVIEW);
    expect(result.current.allAddressesDialog.open).toBe(false);
    expect(result.current.allAddressesDialog.description).toBe(
      `All your accounts holding ${btc.ticker}.`,
    );

    act(() => {
      result.current.onSeeAll();
    });

    expect(result.current.allAddressesDialog.open).toBe(true);
  });

  it("shows the 5 highest-balance accounts first, even when the setting orders by name", () => {
    const usd = getFiatCurrencyByTicker("USD");
    const oneBtc = new BigNumber(10).pow(btc.units[0].magnitude);
    const btcBalances = [2, 6, 1, 5, 3, 4];
    const accounts = btcBalances.map(amount => ({
      ...genAccount(`account-holding-${amount}-btc`, { currency: btc }),
      balance: oneBtc.times(amount),
    }));

    const { result } = renderHook(
      () => useAddressListViewModel(buildDistributionItem({ currency: btc, accounts })),
      {
        initialState: {
          settings: { orderAccounts: "name|asc", counterValue: usd.ticker },
          countervalues: {
            ...countervaluesInitialState,
            rates: buildCV({ pair: { from: btc, to: usd }, latest: 30_000 }),
          },
        },
      },
    );

    const previewBtc = result.current.previewAccounts.map(a => a.balance.div(oneBtc).toNumber());
    // Preview: 6, 5, 4, 3, 2 BTC. The 1 BTC account is the only one left out.
    expect(previewBtc).toEqual([6, 5, 4, 3, 2]);
  });

  it("navigates to the token account URL when a parent account is provided", () => {
    const tokenAccount = genTokenAccount(0, ETH_ACCOUNT, usdcToken);

    const { result } = renderHook(
      () =>
        useAddressListViewModel(
          buildDistributionItem({ currency: btc, accounts: [tokenAccount, ETH_ACCOUNT] }),
        ),
      { initialState: { accounts: [ETH_ACCOUNT] } },
    );

    act(() => {
      result.current.onAccountClick(tokenAccount, ETH_ACCOUNT);
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      getAccountUrl(tokenAccount.id, ETH_ACCOUNT.id),
      expect.objectContaining({ state: { accountBackPath: "/asset/bitcoin" } }),
    );
  });

  it.each([false, true] as const)(
    "navigates to the accounts sidebar when a token has no parent (asset section %s)",
    shouldDisplayAssetSection => {
      const tokenAccount = genTokenAccount(0, ETH_ACCOUNT, usdcToken);

      const { result } = renderHook(
        () =>
          useAddressListViewModel(
            buildDistributionItem({ currency: btc, accounts: [tokenAccount] }),
          ),
        {
          initialState: withFlagOverrides({
            lwdWallet40: { enabled: true, params: { assetSection: shouldDisplayAssetSection } },
          }),
        },
      );

      act(() => {
        result.current.onAccountClick(tokenAccount, null);
      });

      expect(mockNavigate).toHaveBeenCalledWith(getAccountsSidebarPath(shouldDisplayAssetSection));
    },
  );

  it("opens the network-aware asset flow with the resolved network ledger ids", () => {
    mockNetworkLedgerIds.mockReturnValue(["ethereum", "base", "arbitrum", "optimism"]);

    const { result } = renderHook(() =>
      useAddressListViewModel(buildDistributionItem({ currency: btc, accounts: [] })),
    );

    act(() => {
      result.current.onAddAddress();
    });

    expect(mockOpenAssetFlow).toHaveBeenCalledWith(undefined, [
      "ethereum",
      "base",
      "arbitrum",
      "optimism",
    ]);
    expect(mockOpenAddAccountFlow).not.toHaveBeenCalled();
  });

  it("falls back to the single-currency add-account flow when no networks are resolved", () => {
    mockNetworkLedgerIds.mockReturnValue([]);

    const { result } = renderHook(() =>
      useAddressListViewModel(buildDistributionItem({ currency: btc, accounts: [] })),
    );

    act(() => {
      result.current.onAddAddress();
    });

    expect(mockOpenAddAccountFlow).toHaveBeenCalledWith(btc);
    expect(mockOpenAssetFlow).not.toHaveBeenCalled();
  });
});
