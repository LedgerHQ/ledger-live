import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { TEST_ADDRESSES } from "./addresses.fixture";

export const createMockAccount = (options?: Partial<Account>): Account => {
  const seedIdentifier = options?.seedIdentifier || TEST_ADDRESSES.SECP256K1;
  const currency = getCryptoCurrencyById("casper");

  const account: Account = {
    id: `js:2:casper:${seedIdentifier}:casper_wallet`,
    seedIdentifier,
    derivationMode: "casper_wallet",
    index: options?.index || 0,
    freshAddress: options?.freshAddress || seedIdentifier,
    freshAddressPath: options?.freshAddressPath || "44'/506'/0'/0/1",
    blockHeight: options?.blockHeight || 0,
    balance:
      options?.balance instanceof BigNumber
        ? options.balance
        : new BigNumber(options?.balance || "10000000000"),
    spendableBalance:
      options?.spendableBalance instanceof BigNumber
        ? options.spendableBalance
        : new BigNumber(options?.spendableBalance || "10000000000"),
    operations: options?.operations || [],
    pendingOperations: options?.pendingOperations || [],
    type: "Account",
    swapHistory: [],
    syncHash: undefined,
    nfts: [],
    used: true,
    currency,
    operationsCount: 0,
    subAccounts: [],
    creationDate: new Date(),
    lastSyncDate: new Date(),
    balanceHistoryCache: {
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
  };

  return { ...account, ...options };
};

export const createMockAccountId = (address = TEST_ADDRESSES.SECP256K1): string =>
  encodeAccountId({
    type: "js",
    version: "2",
    currencyId: "casper",
    xpubOrAddress: address,
    derivationMode: "casper_wallet",
  });
