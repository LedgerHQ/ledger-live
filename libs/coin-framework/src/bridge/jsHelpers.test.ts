import BigNumber from "bignumber.js";
import { AccountShapeInfo, defaultUpdateTransaction, makeSync } from "./jsHelpers";
import type { Account, SyncConfig, TransactionCommon } from "@ledgerhq/types-live";
import { listCryptoCurrencies } from "../currencies";

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
    it("returns a function to update account that give a new instance of account", done => {
      // Given
      const account = createAccount("12");

      // When
      const accountUpdater = makeSync({
        getAccountShape: (_accountShape: AccountShapeInfo) => Promise.resolve({} as Account),
      })(account, {} as SyncConfig);

      accountUpdater.subscribe(updater => {
        // Then
        expect(updater(account)).not.toBe(account);
        done();
      });
    });

    it("returns a account with a corrected formatted id", done => {
      // Given
      const account = createAccount("12");

      // When
      const accountUpdater = makeSync({
        getAccountShape: (_accountShape: AccountShapeInfo) => Promise.resolve({} as Account),
      })(account, {} as SyncConfig);

      const expectedAccount = {
        ...account,
        id: "js:2:bitcoin::",
        subAccounts: undefined,
      };
      accountUpdater.subscribe(updater => {
        // Then
        expect(updater(account).id).toEqual(expectedAccount.id);
        done();
      });
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

function createAccount(id: string): Account {
  const currency = listCryptoCurrencies(true).find(c => c.id === "bitcoin")!;

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
