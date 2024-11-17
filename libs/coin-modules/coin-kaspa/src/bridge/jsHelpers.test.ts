import BigNumber from "bignumber.js";
import { firstValueFrom } from "rxjs";
import type { Account, SyncConfig, TransactionCommon } from "@ledgerhq/types-live";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { defaultUpdateTransaction, makeSync } from "./jsHelpers";
import { KaspaAccount } from "../types/bridge";
import { getAccountShape } from "./synchronization";

describe("jsHelpers", () => {
  describe("defaultUpdateTransaction", () => {
    it("should not update the transaction object", () => {
      const transaction: TransactionCommon = {
        recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
        amount: new BigNumber("10000000000000"),
      };

      const updatedTransaction = defaultUpdateTransaction(transaction, {
        recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
        amount: new BigNumber("10000000000000"),
      });

      expect(transaction).toBe(updatedTransaction);
    });

    it("should update the transaction object", () => {
      const transaction: TransactionCommon = {
        recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
        amount: new BigNumber("10000000000000"),
      };

      const updatedTransaction = defaultUpdateTransaction(transaction, {
        recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
        amount: new BigNumber("20000000000000"),
      });

      expect(transaction).not.toBe(updatedTransaction);

      expect(updatedTransaction).toEqual({
        ...transaction,
        amount: new BigNumber("20000000000000"),
      });
    });
  });

  describe("makeSync", () => {
    it("returns a function to update account that give a new instance of account", async () => {
      // Given
      const account = createAccount({
        id: "kaspa",
        creationDate: new Date("2024-05-14T17:04:12"),
        lastSyncDate: new Date("2024-05-14T17:04:12"),
        xpub: "410404cd27f15b8a73039972cdd131a93784ef3fa90bee794222737f5ca26a12f887f2fd493acf13230fa42c418d2c1be53a6fc66fbbec3ea9c37a675acc53a65e08203a35a71b1d8c10f7b03cf84c50570ee21af9b830b25bbe16ec661e7de8a51563",
      });

      // When
      const accountUpdater = makeSync({
        getAccountShape: getAccountShape,
      })(account, {} as SyncConfig);
      const updater = await firstValueFrom(accountUpdater);
      const newAccount = updater(account);

      // Then
      const nonUpdatedFields = {
        ...account,
        id: expect.any(String),
        creationDate: expect.any(Date),
        lastSyncDate: expect.any(Date),
        subAccounts: [],
      };
      expect(newAccount).toEqual(nonUpdatedFields);
      expect(newAccount.id).not.toEqual(account.id);
      expect(newAccount.creationDate).not.toEqual(account.creationDate);
      expect(newAccount.lastSyncDate).not.toEqual(account.lastSyncDate);
    });

    it("returns a account with a corrected formatted id", async () => {
      // Given
      const account = createAccount({
        id: "kaspa",
        creationDate: new Date("2024-05-14T17:04:12"),
        lastSyncDate: new Date("2024-05-14T17:04:12"),
        xpub: "410404cd27f15b8a73039972cdd131a93754ef3fa90bee794222737f5ca26a12f887f2fd493acf13230fa42c418d2c1be53a6fc66fbbec3ea9c37a675acc53a65e08203a35a71b1d8c10f7b03cf84c50570ee21af9b830b25bbe16ec661e7de8a51563",
      });

      // When
      const accountUpdater = makeSync({
        getAccountShape: getAccountShape,
      })(account, {} as SyncConfig);
      const updater = await firstValueFrom(accountUpdater);
      const newAccount = updater(account);

      // Then
      const expectedAccount = {
        ...account,
        id: "js:2:kaspa:410404cd27f15b8a73039972cdd131a93754ef3fa90bee794222737f5ca26a12f887f2fd493acf13230fa42c418d2c1be53a6fc66fbbec3ea9c37a675acc53a65e08203a35a71b1d8c10f7b03cf84c50570ee21af9b830b25bbe16ec661e7de8a51563:",
        subAccounts: undefined,
      };
      expect(newAccount.id).toEqual(expectedAccount.id);
    });
  });
});

const emptyHistoryCache = {
  HOUR: {
    latestDate: null,
    balances: [],
  },
  DAY: {
    latestDate: null,
    balances: [],
  },
  WEEK: {
    latestDate: null,
    balances: [],
  },
};

// Call once for all tests the currencies. Relies on real implementation to check also consistency.
const kaspaCurrency = listCryptoCurrencies(true).find(c => c.id === "kaspa")!;

function createAccount(init: Partial<Account>): KaspaAccount {
  const currency = kaspaCurrency;

  return {
    type: "Account",
    id: init.id ?? "12",
    seedIdentifier: "",
    derivationMode: "",
    index: 0,
    freshAddress: "",
    freshAddressPath: "",
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: init.creationDate ?? new Date(),
    blockHeight: 0,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    // subAccounts: [],
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
    xpub: init.xpub ?? "",
  };
}
