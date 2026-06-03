import { renderHook, act } from "@tests/test-renderer";
import BigNumber from "bignumber.js";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { Account, DistributionItem } from "@ledgerhq/types-live";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  usdcToken,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import { track } from "~/analytics";
import { NavigatorName, ScreenName } from "~/const";
import { AddAccountContexts } from "LLM/features/Accounts/screens/AddAccount/enums";
import type { State } from "~/reducers/types";
import { useAddressesViewModel } from "../useAddressesViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

function withRawAccounts(accounts: Account[]) {
  return {
    overrideInitialState: (state: State): State => ({
      ...state,
      accounts: { ...state.accounts, active: accounts },
    }),
  };
}

function buildDistributionItem(
  currency: DistributionItem["currency"],
  accounts: DistributionItem["accounts"],
): DistributionItem {
  return {
    currency,
    distribution: 1,
    accounts,
    amount: accounts.reduce((sum, a) => sum + a.balance.toNumber(), 0),
    countervalue: 0,
  };
}

const algorandCurrency = getCryptoCurrencyById("algorand");
const usdtEthToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd_tether__erc20_",
  contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  parentCurrency: mockEthCryptoCurrency,
  tokenType: "erc20",
  name: "Tether USD",
  ticker: "USDT",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
};
const usdtAlgoToken: TokenCurrency = {
  type: "TokenCurrency",
  id: "algorand/asa/312769",
  contractAddress: "312769",
  parentCurrency: algorandCurrency,
  tokenType: "asa",
  name: "Tether USDt",
  ticker: "USDT",
  units: [{ name: "Tether USDt", code: "USDT", magnitude: 6 }],
};

describe("useAddressesViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("displayedAccounts", () => {
    it("returns an empty array when currency or distributionItem is undefined", () => {
      const { result } = renderHook(() => useAddressesViewModel(undefined, undefined));
      expect(result.current.displayedAccounts).toEqual([]);

      const { result: noDistribution } = renderHook(() =>
        useAddressesViewModel(mockBtcCryptoCurrency, undefined),
      );
      expect(noDistribution.current.displayedAccounts).toEqual([]);
    });

    it("returns one tuple per top-level account in the distribution item", () => {
      const btcAccounts = [
        genAccount("bitcoin-0", { currency: mockBtcCryptoCurrency, operationsSize: 0 }),
        genAccount("bitcoin-1", { currency: mockBtcCryptoCurrency, operationsSize: 0 }),
      ];

      const { result } = renderHook(
        () =>
          useAddressesViewModel(
            mockBtcCryptoCurrency,
            buildDistributionItem(mockBtcCryptoCurrency, btcAccounts),
          ),
        withRawAccounts(btcAccounts),
      );

      expect(result.current.displayedAccounts).toHaveLength(2);
      result.current.displayedAccounts.forEach(acc => {
        expect(acc.name).toBeDefined();
        expect(acc.truncatedAddress).toBeDefined();
        expect(acc.balanceAccount).toBe(acc.account);
      });
    });

    it("returns tuples across every network of a multi-network asset", () => {
      const ethAccount = genAccount("usdt-eth", {
        currency: mockEthCryptoCurrency,
        operationsSize: 0,
      });
      const ethSub = genTokenAccount(0, ethAccount, usdtEthToken);
      ethSub.balance = new BigNumber(120_000_000);
      ethAccount.subAccounts = [ethSub];

      const algoAccount = genAccount("usdt-algo", {
        currency: algorandCurrency,
        operationsSize: 0,
      });
      const algoSub = genTokenAccount(0, algoAccount, usdtAlgoToken);
      algoSub.balance = new BigNumber(80_000_000);
      algoAccount.subAccounts = [algoSub];

      const { result } = renderHook(
        () =>
          useAddressesViewModel(
            usdtEthToken,
            buildDistributionItem(usdtEthToken, [ethSub, algoSub]),
          ),
        withRawAccounts([ethAccount, algoAccount]),
      );

      const parentIds = result.current.displayedAccounts.map(a => a.account.id).sort();
      expect(parentIds).toEqual([ethAccount.id, algoAccount.id].sort());
      result.current.displayedAccounts.forEach(entry => {
        expect(entry.balanceAccount.type).toBe("TokenAccount");
      });
    });
  });

  describe("preview cap and See all", () => {
    const buildBtcSetup = (count: number) => {
      const btcAccounts = Array.from({ length: count }, (_, i) =>
        genAccount(`bitcoin-${i}`, { currency: mockBtcCryptoCurrency, operationsSize: 0 }),
      );
      return {
        btcAccounts,
        distributionItem: buildDistributionItem(mockBtcCryptoCurrency, btcAccounts),
      };
    };

    describe("displayedAccounts", () => {
      it("caps displayedAccounts to 5 when more accounts exist", () => {
        const { btcAccounts, distributionItem } = buildBtcSetup(7);
        const { result } = renderHook(
          () => useAddressesViewModel(mockBtcCryptoCurrency, distributionItem),
          withRawAccounts(btcAccounts),
        );

        expect(result.current.displayedAccounts).toHaveLength(5);
      });
    });

    describe("addressesCount", () => {
      it("returns the total number of accounts (not capped by the preview)", () => {
        const { btcAccounts, distributionItem } = buildBtcSetup(8);
        const { result } = renderHook(
          () => useAddressesViewModel(mockBtcCryptoCurrency, distributionItem),
          withRawAccounts(btcAccounts),
        );

        expect(result.current.addressesCount).toBe(8);
        expect(result.current.displayedAccounts).toHaveLength(5);
      });

      it("is 0 when distributionItem is undefined", () => {
        const { result } = renderHook(() =>
          useAddressesViewModel(mockBtcCryptoCurrency, undefined),
        );
        expect(result.current.addressesCount).toBe(0);
      });
    });

    describe("hasMore", () => {
      it("is false when there are fewer than 5 accounts", () => {
        const { btcAccounts, distributionItem } = buildBtcSetup(4);
        const { result } = renderHook(
          () => useAddressesViewModel(mockBtcCryptoCurrency, distributionItem),
          withRawAccounts(btcAccounts),
        );

        expect(result.current.hasMore).toBe(false);
      });

      it("is false when there are exactly 5 accounts (all fit in the preview)", () => {
        const { btcAccounts, distributionItem } = buildBtcSetup(5);
        const { result } = renderHook(
          () => useAddressesViewModel(mockBtcCryptoCurrency, distributionItem),
          withRawAccounts(btcAccounts),
        );

        expect(result.current.hasMore).toBe(false);
      });

      it("is true when there are more than 5 accounts", () => {
        const { btcAccounts, distributionItem } = buildBtcSetup(8);
        const { result } = renderHook(
          () => useAddressesViewModel(mockBtcCryptoCurrency, distributionItem),
          withRawAccounts(btcAccounts),
        );

        expect(result.current.hasMore).toBe(true);
      });
    });

    describe("onSeeAll", () => {
      it("opens the all addresses drawer and fires analytics", () => {
        const { btcAccounts, distributionItem } = buildBtcSetup(6);

        const { result } = renderHook(
          () => useAddressesViewModel(mockBtcCryptoCurrency, distributionItem),
          withRawAccounts(btcAccounts),
        );

        expect(result.current.isAllAddressesDrawerOpen).toBe(false);

        act(() => result.current.onSeeAll());

        expect(result.current.isAllAddressesDrawerOpen).toBe(true);
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(track).toHaveBeenCalledWith("button_clicked", {
          button: "see_all_addresses",
          currency: "bitcoin",
          page: "Asset Detail",
        });
      });

      it("exposes the parent accountIds for the drawer", () => {
        const { btcAccounts, distributionItem } = buildBtcSetup(6);

        const { result } = renderHook(
          () => useAddressesViewModel(mockBtcCryptoCurrency, distributionItem),
          withRawAccounts(btcAccounts),
        );

        const expectedIds = btcAccounts.map(a => a.id);
        expect(result.current.allAccountIds).toEqual(expect.arrayContaining(expectedIds));
        expect(result.current.allAccountIds).toHaveLength(expectedIds.length);
      });

      it("exposes deduplicated parent accountIds for multi-network tokens", () => {
        const ethAccount = genAccount("usdt-eth", {
          currency: mockEthCryptoCurrency,
          operationsSize: 0,
        });
        const ethSub = genTokenAccount(0, ethAccount, usdtEthToken);
        ethSub.balance = new BigNumber(120_000_000);
        ethAccount.subAccounts = [ethSub];

        const algoAccount = genAccount("usdt-algo", {
          currency: algorandCurrency,
          operationsSize: 0,
        });
        const algoSub = genTokenAccount(0, algoAccount, usdtAlgoToken);
        algoSub.balance = new BigNumber(80_000_000);
        algoAccount.subAccounts = [algoSub];

        const { result } = renderHook(
          () =>
            useAddressesViewModel(
              usdtEthToken,
              buildDistributionItem(usdtEthToken, [ethSub, algoSub]),
            ),
          withRawAccounts([ethAccount, algoAccount]),
        );

        expect(result.current.allAccountIds).toEqual(
          expect.arrayContaining([ethAccount.id, algoAccount.id]),
        );
        expect(result.current.allAccountIds).toHaveLength(2);
      });

      it("does nothing when currency is undefined", () => {
        const { result } = renderHook(() => useAddressesViewModel(undefined, undefined));

        act(() => result.current.onSeeAll());

        expect(result.current.isAllAddressesDrawerOpen).toBe(false);
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(track).not.toHaveBeenCalled();
      });
    });

    describe("closeAllAddressesDrawer", () => {
      it("closes the all addresses drawer", () => {
        const { btcAccounts, distributionItem } = buildBtcSetup(6);

        const { result } = renderHook(
          () => useAddressesViewModel(mockBtcCryptoCurrency, distributionItem),
          withRawAccounts(btcAccounts),
        );

        act(() => result.current.onSeeAll());
        expect(result.current.isAllAddressesDrawerOpen).toBe(true);

        act(() => result.current.closeAllAddressesDrawer());
        expect(result.current.isAllAddressesDrawerOpen).toBe(false);
      });
    });
  });

  describe("onAccountPress", () => {
    it("navigates to the Account screen for a main account and fires analytics", () => {
      const btcAccounts = [
        genAccount("bitcoin-0", { currency: mockBtcCryptoCurrency, operationsSize: 0 }),
      ];

      const { result } = renderHook(
        () =>
          useAddressesViewModel(
            mockBtcCryptoCurrency,
            buildDistributionItem(mockBtcCryptoCurrency, btcAccounts),
          ),
        withRawAccounts(btcAccounts),
      );

      const [data] = result.current.displayedAccounts;
      act(() => result.current.onAccountPress(data));

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Account,
        params: { accountId: btcAccounts[0].id },
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Account",
        currency: "bitcoin",
        chain: "bitcoin",
        page: "Asset Detail",
      });
    });

    it("navigates to the parent account for a token account and tracks the chain", () => {
      const ethAccount = genAccount("usdt-eth", {
        currency: mockEthCryptoCurrency,
        operationsSize: 0,
      });
      const ethSub = genTokenAccount(0, ethAccount, usdtEthToken);
      ethSub.balance = new BigNumber(120_000_000);
      ethAccount.subAccounts = [ethSub];

      const { result } = renderHook(
        () => useAddressesViewModel(usdtEthToken, buildDistributionItem(usdtEthToken, [ethSub])),
        withRawAccounts([ethAccount]),
      );

      const [data] = result.current.displayedAccounts;
      act(() => result.current.onAccountPress(data));

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.Accounts, {
        screen: ScreenName.Account,
        params: {
          currencyId: mockEthCryptoCurrency.id,
          parentId: ethAccount.id,
          accountId: ethSub.id,
        },
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "Account",
        currency: usdtEthToken.id,
        chain: mockEthCryptoCurrency.id,
        page: "Asset Detail",
      });
    });

    it("does nothing when currency is undefined", () => {
      const btcAccount = genAccount("bitcoin-0", {
        currency: mockBtcCryptoCurrency,
        operationsSize: 0,
      });

      const { result } = renderHook(() => useAddressesViewModel(undefined, undefined));

      act(() =>
        result.current.onAccountPress({
          id: btcAccount.id,
          account: btcAccount,
          balanceAccount: btcAccount,
          name: "name",
          truncatedAddress: "addr",
        }),
      );

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(track).not.toHaveBeenCalled();
    });
  });

  describe("onAddAccount", () => {
    it("navigates to device selection and fires analytics", () => {
      const btcAccounts = [
        genAccount("bitcoin-0", { currency: mockBtcCryptoCurrency, operationsSize: 0 }),
      ];

      const { result } = renderHook(
        () =>
          useAddressesViewModel(
            mockBtcCryptoCurrency,
            buildDistributionItem(mockBtcCryptoCurrency, btcAccounts),
          ),
        withRawAccounts(btcAccounts),
      );

      act(() => result.current.onAddAccount());

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          currency: mockBtcCryptoCurrency,
          context: AddAccountContexts.AddAccounts,
        },
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "add_account",
        currency: "bitcoin",
        page: "Asset Detail",
      });
    });

    it("does nothing when currency is undefined", () => {
      const { result } = renderHook(() => useAddressesViewModel(undefined, undefined));

      act(() => result.current.onAddAccount());

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(track).not.toHaveBeenCalled();
    });

    it("navigates with parentCurrency when currency is a token", () => {
      const { result } = renderHook(() => useAddressesViewModel(usdcToken, undefined));

      act(() => result.current.onAddAccount());

      expect(mockNavigate).toHaveBeenCalledWith(NavigatorName.DeviceSelection, {
        screen: ScreenName.SelectDevice,
        params: {
          currency: mockEthCryptoCurrency,
          context: AddAccountContexts.AddAccounts,
        },
      });
      expect(track).toHaveBeenCalledWith("button_clicked", {
        button: "add_account",
        currency: usdcToken.id,
        page: "Asset Detail",
      });
    });
  });
});
