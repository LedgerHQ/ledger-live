import BigNumber from "bignumber.js";
import { AccountShapeInfo, defaultUpdateTransaction, makeSync } from "./jsHelpers";
import type { Account, SyncConfig, TransactionCommon } from "@ledgerhq/types-live";
import { listCryptoCurrencies } from "../currencies";
import { firstValueFrom } from "rxjs";

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
      const account = createAccount("12");

      // When
      const accountUpdater = makeSync({
        getAccountShape: (_accountShape: AccountShapeInfo) => Promise.resolve({} as Account),
      })(account, {} as SyncConfig);
      const updater = await firstValueFrom(accountUpdater);
      const newAccount = updater(account);

      // Then
      const nonUpdatedFields = {
        ...account,
        id: expect.any(String),
        creationDate: expect.any(Date),
        lastSyncDate: expect.any(Date),
        subAccounts: undefined,
      };
      expect(newAccount).toEqual(nonUpdatedFields);
      expect(newAccount.id).not.toEqual(account.id);
      expect(newAccount.creationDate).not.toEqual(account.creationDate);
      expect(newAccount.lastSyncDate).not.toEqual(account.lastSyncDate);
    });

    it("returns a account with a corrected formatted id", async () => {
      // Given
      const account = createAccount("12");

      // When
      const accountUpdater = makeSync({
        getAccountShape: (_accountShape: AccountShapeInfo) => Promise.resolve({} as Account),
      })(account, {} as SyncConfig);
      const updater = await firstValueFrom(accountUpdater);
      const newAccount = updater(account);

      // Then
      const expectedAccount = {
        ...account,
        id: "js:2:bitcoin::",
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
const bitcoinCurrency = listCryptoCurrencies(true).find(c => c.id === "bitcoin")!;
function createAccount(id: string): Account {
  const currency = bitcoinCurrency;

  return {
    type: "Account",
    id,
    seedIdentifier: "",
    derivationMode: "",
    index: 0,
    freshAddress: "",
    freshAddressPath: "",
    freshAddresses: [],
    name: "",
    starred: false,
    used: true,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 0,
    currency,
    unit: currency.units[0],
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    // subAccounts: [],
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],
  };
}
