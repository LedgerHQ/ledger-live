import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";

const emptyBalanceHistory = {
  HOUR: { balances: [], latestDate: undefined },
  DAY: { balances: [], latestDate: undefined },
  WEEK: { balances: [], latestDate: undefined },
};

export function createFixtureTokenAccount(id = "00", token: TokenCurrency): TokenAccount {
  return {
    type: "TokenAccount",
    id: `js:2:ethereum:0x${id}:+${token.id}`,
    parentId: `js:2:ethereum:0x0${id}:`,
    token,
    balance: new BigNumber("51281813126095913"),
    spendableBalance: new BigNumber("51281813126095913"),
    creationDate: new Date(),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: emptyBalanceHistory,
    swapHistory: [],
  };
}

export function createFixtureAccount(id = "00", currency: CryptoCurrency): Account {
  return {
    type: "Account",
    id: `js:2:${currency.id}:0x0${id}:`,
    seedIdentifier: "0x01",
    derivationMode: "ethM" as Account["derivationMode"],
    index: 0,
    freshAddress: "0x01",
    freshAddressPath: "44'/60'/0'/0/0",
    used: false,
    balance: new BigNumber("51281813126095913"),
    spendableBalance: new BigNumber("51281813126095913"),
    creationDate: new Date(),
    blockHeight: 0,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    subAccounts: [],
    balanceHistoryCache: emptyBalanceHistory,
    swapHistory: [],
  };
}
