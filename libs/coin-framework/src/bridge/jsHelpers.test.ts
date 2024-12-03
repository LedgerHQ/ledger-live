import BigNumber from "bignumber.js";
import { firstValueFrom } from "rxjs";
import type { Account, SyncConfig, TransactionCommon } from "@ledgerhq/types-live";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { AccountShapeInfo, updateTransaction, makeSync, bip32asBuffer } from "./jsHelpers";

describe("jsHelpers", () => {
  describe("updateTransaction", () => {
    it("should not update the transaction object", () => {
      const transaction: TransactionCommon = {
        recipient: "0x17733CAb76d9A2112576443F21735789733B1ca3",
        amount: new BigNumber("10000000000000"),
      };

      const updatedTransaction = updateTransaction(transaction, {
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

      const updatedTransaction = updateTransaction(transaction, {
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
        id: "12",
        creationDate: new Date("2024-05-12T17:04:12"),
        lastSyncDate: new Date("2024-05-12T17:04:12"),
      });

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
        id: "12",
        creationDate: new Date("2024-05-12T17:04:12"),
        lastSyncDate: new Date("2024-05-12T17:04:12"),
      });

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

  describe("bip32asBuffer", () => {
    it.each([
      {
        name: "Simple",
        derivationPath: "m/44'/1/1/0",
        expectedResult: "048000002c000000010000000100000000",
      },
      {
        name: "Hardened coin type",
        derivationPath: "m/44'/1'/1/0",
        expectedResult: "048000002c800000010000000100000000",
      },
      {
        name: "Hardened account",
        derivationPath: "m/44'/1'/1'/0",
        expectedResult: "048000002c800000018000000100000000",
      },
    ])("converts path for AppCoins with $name case", ({ derivationPath, expectedResult }) => {
      const path = bip32asBuffer(derivationPath);
      expect(path).toEqual(Buffer.from(expectedResult, "hex"));
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
function createAccount(init: Partial<Account>): Account {
  const currency = bitcoinCurrency;

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
  };
}
