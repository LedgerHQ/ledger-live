import BigNumber from "bignumber.js";
import { firstValueFrom } from "rxjs";
import type { Account, SyncConfig } from "@ledgerhq/types-live";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { makeSync } from "./jsHelpers";
import { KaspaAccount } from "../types/bridge";
import { getAccountShape } from "./synchronization";

describe("jsHelpers", () => {
  describe("makeSync", () => {
    it("returns a function to update account that give a new instance of account", async () => {
      // Given
      const account = createAccount({
        id: "kaspa",
        creationDate: new Date("2024-05-14T17:04:12"),
        lastSyncDate: new Date("2024-05-14T17:04:12"),
        xpub: "410404cd27f15b8a73039972cdd131a93754ef3fa90bee794222717f5ca26a12f887f2fd493acf13230fa42c418d2c1be53a6fc66fbbec3ea9c37a675acc53a65e08203a35a71b1d8c10f7b03cf84c50570ee21af9b830b25bbe16ec661e7de8a51563",
        index: 0,
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

    it("check a real xpub for being an active account", async () => {
      // Given
      const account = createAccount({
        id: "kaspa",
        creationDate: new Date("2024-05-14T17:04:12"),
        lastSyncDate: new Date("2024-05-14T17:04:12"),
        xpub: "410404cd27f15b8a73039972cdd131a93754ef3fa90bee794222737f5ca26a12f887f2fd493acf13230fa42c418d2c1be53a6fc66fbbec3ea9c37a675acc53a65e08203a35a71b1d8c10f7b03cf84c50570ee21af9b830b25bbe16ec661e7de8a51563",
        index: 0,
      });

      // When
      const accountUpdater = makeSync({
        getAccountShape: getAccountShape,
      })(account, {} as SyncConfig);
      const updater = await firstValueFrom(accountUpdater);
      const newAccount = updater(account);

      expect(newAccount.nextReceiveAddressIndex).toBeGreaterThan(5);
      expect(newAccount.nextChangeAddressIndex).toBeGreaterThan(0);

      expect(newAccount.balance.gt(0)).toBe(true);
      expect(newAccount.spendableBalance.gt(0)).toBe(true);
      expect(newAccount.spendableBalance.eq(newAccount.balance)).toBe(true);
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
    nextChangeAddress: "kaspa:qryvp4gkds46gfwjvadaj8z5l63d5lvxjy03h3t9sk0pa3f65rh82dedyej96",
    nextChangeAddressIndex: 0,
    nextChangeAddressType: 1,
    nextReceiveAddress: "kaspa:qrzu7d603all3v3n0x3vfcc056ptj3mm3pn643wercy8u32yvcng5fehwyh0e",
    nextReceiveAddressIndex: 0,
    nextReceiveAddressType: 0,
  };
}
