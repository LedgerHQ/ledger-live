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
        xpub: "035a19ab1842af431d3b4fa88a15b1fe7d7c3f6e26e808124a10dc0523352d462d0ba599a9c5bad1106065eab47b48efa070f4b31e9639c9d096f7756b248a6ff4",
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
        xpub: "035a19ab1842af431d3b4fa88a15b1fe7d7c3f6e26e808124a10dc0523352d462d0ba599a9c5bad1106065eab47b48efa070f4b31e9639c9d096f7756b248a6ff4",
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
        id: "js:2:kaspa::",
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
