import { renderHook } from "@tests/test-renderer";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import {
  mockBtcCryptoCurrency,
  mockEthCryptoCurrency,
  usdcToken,
} from "@ledgerhq/live-common/modularDrawer/__mocks__/currencies.mock";
import type { Account, AccountLike, DistributionItem } from "@ledgerhq/types-live";
import type { State } from "~/reducers/types";
import { useTransactionsViewModel } from "../useTransactionsViewModel";

function buildDistributionItem(
  currency: DistributionItem["currency"],
  accounts: AccountLike[],
): DistributionItem {
  return {
    currency,
    distribution: 1,
    accounts,
    amount: accounts.reduce((sum, a) => sum + a.balance.toNumber(), 0),
    countervalue: 0,
  };
}

function withState(activeAccounts: Account[]) {
  return {
    overrideInitialState: (state: State): State => ({
      ...state,
      accounts: { ...state.accounts, active: activeAccounts },
    }),
  };
}

const btcAccount = genAccount("bitcoin-0", { currency: mockBtcCryptoCurrency, operationsSize: 5 });
const ethRoot = genAccount("eth-no-distribution", {
  currency: mockEthCryptoCurrency,
  subAccountsCount: 0,
  operationsSize: 5,
});
const usdc = genTokenAccount(0, ethRoot, usdcToken);
const ethTree: Account = { ...ethRoot, subAccounts: [usdc] };

describe("useTransactionsViewModel", () => {
  it("returns no account ids without currency nor distribution", () => {
    const { result } = renderHook(() => useTransactionsViewModel(undefined, undefined));
    expect(result.current.accountIds).toEqual([]);
  });

  it("uses the distribution accounts when available", () => {
    const distributionItem = buildDistributionItem(usdcToken, [usdc]);
    const { result } = renderHook(
      () => useTransactionsViewModel(usdcToken, distributionItem),
      withState([ethTree]),
    );

    expect(result.current.accountIds).toEqual([usdc.id]);
    expect(result.current.currencyId).toBe(usdcToken.id);
  });

  it("falls back to the native currency accounts when the distribution is missing", () => {
    const { result } = renderHook(
      () => useTransactionsViewModel(mockBtcCryptoCurrency, undefined),
      withState([btcAccount, ethTree]),
    );

    expect(result.current.accountIds).toEqual([btcAccount.id]);
  });

  it("returns no account ids for a token currency without distribution", () => {
    const { result } = renderHook(
      () => useTransactionsViewModel(usdcToken, undefined),
      withState([ethTree]),
    );

    expect(result.current.accountIds).toEqual([]);
  });
});
