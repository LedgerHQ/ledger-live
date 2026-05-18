import BigNumber from "bignumber.js";
import type { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

const emptyBalanceHistoryCache = {
  HOUR: { balances: [], latestDate: undefined },
  DAY: { balances: [], latestDate: undefined },
  WEEK: { balances: [], latestDate: undefined },
};

export type CommonOverrides = Partial<
  Pick<Account, "id" | "balance" | "spendableBalance" | "operations" | "operationsCount">
>;

export type TokenAccountOverrides = CommonOverrides & { parentId?: string };

type CommonDefaults = {
  balance: BigNumber;
  spendableBalance: BigNumber;
  operations: Operation[];
  operationsCount: number;
};

function applyCommonDefaults(id: string, overrides: CommonOverrides): CommonDefaults {
  const operations = (overrides.operations ?? []).map(op => ({ ...op, accountId: id }));
  const balance = overrides.balance ?? new BigNumber(0);
  return {
    balance,
    spendableBalance: overrides.spendableBalance ?? balance,
    operations,
    operationsCount: overrides.operationsCount ?? operations.length,
  };
}

export function makeAccount(currency: CryptoCurrency, overrides: CommonOverrides = {}): Account {
  const id = overrides.id ?? `js:2:${currency.id}:0xtest:`;
  const common = applyCommonDefaults(id, overrides);
  return {
    type: "Account",
    id,
    seedIdentifier: "0xtest",
    derivationMode: "" as Account["derivationMode"],
    index: 0,
    freshAddress: "0xtest",
    freshAddressPath: "44'/60'/0'/0/0",
    used: common.operations.length > 0,
    creationDate: new Date("2024-01-01T00:00:00Z"),
    blockHeight: 0,
    currency,
    pendingOperations: [],
    lastSyncDate: new Date("2026-01-01T00:00:00Z"),
    subAccounts: [],
    balanceHistoryCache: emptyBalanceHistoryCache,
    swapHistory: [],
    ...common,
  };
}

export function makeTokenAccount(
  token: TokenCurrency,
  overrides: TokenAccountOverrides = {},
): TokenAccount {
  const parentId = overrides.parentId ?? `js:2:${token.parentCurrency.id}:0xtest:`;
  const id = overrides.id ?? `${parentId}+${token.id}`;
  const common = applyCommonDefaults(id, overrides);
  return {
    type: "TokenAccount",
    id,
    parentId,
    token,
    creationDate: new Date("2024-01-01T00:00:00Z"),
    pendingOperations: [],
    balanceHistoryCache: emptyBalanceHistoryCache,
    swapHistory: [],
    ...common,
  };
}

export function makeAccountWithTokens(
  currency: CryptoCurrency,
  tokens: TokenAccount[],
  overrides: CommonOverrides = {},
): Account {
  const account = makeAccount(currency, overrides);
  return { ...account, subAccounts: tokens };
}
