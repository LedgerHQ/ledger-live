import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { fromAccountRaw } from "@ledgerhq/coin-framework/serialization/account";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import {
  importAccountsReduce,
  type ImportItem,
  type ImportAccountsReduceInput,
  type SyncNewAccountsOutput,
} from "./importAccounts";

setupMockCryptoAssetsStore({
  getTokensSyncHash: async () => "0",
});

// Mock account factory using fromAccountRaw for proper Account structure
const createMockAccount = async (
  id: string,
  name: string,
  currencyId: string = "ethereum",
  balance: string = "1000000000000000000",
): Promise<Account> => {
  const accountRaw: AccountRaw = {
    id,
    seedIdentifier: "seed",
    name,
    derivationMode: "",
    index: 0,
    freshAddress: `0x${id.slice(-2)}`,
    freshAddressPath: "44'/60'/0'/0/0",
    blockHeight: 0,
    operations: [],
    pendingOperations: [],
    currencyId,
    lastSyncDate: new Date().toISOString(),
    balance,
    spendableBalance: balance,
    used: true,
    creationDate: new Date().toISOString(),
  };

  return await fromAccountRaw(accountRaw);
};

describe("importAccountsReduce", () => {
  let existingAccount1: Account;
  let existingAccount2: Account;
  let existingAccounts: Account[];
  let newAccount1: Account;
  let newAccount2: Account;
  let updatedAccount1: Account;

  beforeAll(async () => {
    existingAccount1 = await createMockAccount("js:1:ethereum:0x01:", "Existing Account 1");
    existingAccount2 = await createMockAccount("js:1:ethereum:0x02:", "Existing Account 2");
    existingAccounts = [existingAccount1, existingAccount2];
    newAccount1 = await createMockAccount("js:1:ethereum:0x03:", "New Account 1");
    newAccount2 = await createMockAccount("js:1:ethereum:0x04:", "New Account 2");
    updatedAccount1 = await createMockAccount("js:1:ethereum:0x01:", "Updated Account 1");
  });

  describe("create mode", () => {
    it("should add new accounts when mode is 'create'", () => {
      const items: ImportItem[] = [
        {
          initialAccountId: "js:1:ethereum:0x03:",
          account: newAccount1,
          mode: "create",
        },
        {
          initialAccountId: "js:1:ethereum:0x04:",
          account: newAccount2,
          mode: "create",
        },
      ];

      const syncResult: SyncNewAccountsOutput = {
        synchronized: {
          "js:1:ethereum:0x03:": newAccount1,
          "js:1:ethereum:0x04:": newAccount2,
        },
        failed: {},
      };

      const input: ImportAccountsReduceInput = {
        items,
        selectedAccounts: ["js:1:ethereum:0x03:", "js:1:ethereum:0x04:"],
        syncResult,
      };

      const result = importAccountsReduce(existingAccounts, input);

      expect(result).toHaveLength(4);
      expect(result).toContain(existingAccount1);
      expect(result).toContain(existingAccount2);
      expect(result).toContain(newAccount1);
      expect(result).toContain(newAccount2);
    });

    it("should not add accounts that already exist to prevent duplicates", () => {
      const items: ImportItem[] = [
        {
          initialAccountId: "js:1:ethereum:0x01:",
          account: existingAccount1,
          mode: "create",
        },
      ];

      const syncResult: SyncNewAccountsOutput = {
        synchronized: {
          "js:1:ethereum:0x01:": existingAccount1,
        },
        failed: {},
      };

      const input: ImportAccountsReduceInput = {
        items,
        selectedAccounts: ["js:1:ethereum:0x01:"],
        syncResult,
      };

      const result = importAccountsReduce(existingAccounts, input);

      expect(result).toHaveLength(2);
      expect(result.filter(acc => acc.id === "js:1:ethereum:0x01:")).toHaveLength(1);
    });

    it("should handle account id remapping after sync", async () => {
      const remappedAccount = await createMockAccount("js:1:ethereum:0x05:", "Remapped Account");

      const items: ImportItem[] = [
        {
          initialAccountId: "js:1:ethereum:0x03:",
          account: newAccount1, // original account
          mode: "create",
        },
      ];

      const syncResult: SyncNewAccountsOutput = {
        synchronized: {
          "js:1:ethereum:0x03:": remappedAccount, // account was remapped during sync
        },
        failed: {},
      };

      const input: ImportAccountsReduceInput = {
        items,
        selectedAccounts: ["js:1:ethereum:0x03:"],
        syncResult,
      };

      const result = importAccountsReduce(existingAccounts, input);

      expect(result).toHaveLength(3);
      expect(result).toContain(remappedAccount);
      expect(result).not.toContain(newAccount1);
    });
  });

  describe("update mode", () => {
    it("should update existing accounts when mode is 'update'", () => {
      const items: ImportItem[] = [
        {
          initialAccountId: "js:1:ethereum:0x01:",
          account: existingAccount1,
          mode: "update",
        },
      ];

      const syncResult: SyncNewAccountsOutput = {
        synchronized: {
          "js:1:ethereum:0x01:": updatedAccount1,
        },
        failed: {},
      };

      const input: ImportAccountsReduceInput = {
        items,
        selectedAccounts: ["js:1:ethereum:0x01:"],
        syncResult,
      };

      const result = importAccountsReduce(existingAccounts, input);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(updatedAccount1);
      expect(result[1]).toBe(existingAccount2);
    });

    it("should handle update when account id changed after sync", async () => {
      const updatedAccountWithNewId = await createMockAccount(
        "js:1:ethereum:0x99:",
        "Updated with new ID",
      );

      const items: ImportItem[] = [
        {
          initialAccountId: "js:1:ethereum:0x01:",
          account: existingAccount1,
          mode: "update",
        },
      ];

      const syncResult: SyncNewAccountsOutput = {
        synchronized: {
          "js:1:ethereum:0x01:": updatedAccountWithNewId, // account id changed during sync
        },
        failed: {},
      };

      const input: ImportAccountsReduceInput = {
        items,
        selectedAccounts: ["js:1:ethereum:0x01:"],
        syncResult,
      };

      const result = importAccountsReduce(existingAccounts, input);

      expect(result).toHaveLength(2);
      expect(result[0]).toBe(updatedAccountWithNewId);
      expect(result[1]).toBe(existingAccount2);
    });

    it("should not update if account is not found in existing accounts", () => {
      const items: ImportItem[] = [
        {
          initialAccountId: "js:1:ethereum:0x99:", // non-existent account
          account: newAccount1,
          mode: "update",
        },
      ];

      const syncResult: SyncNewAccountsOutput = {
        synchronized: {
          "js:1:ethereum:0x99:": newAccount1,
        },
        failed: {},
      };

      const input: ImportAccountsReduceInput = {
        items,
        selectedAccounts: ["js:1:ethereum:0x99:"],
        syncResult,
      };

      const result = importAccountsReduce(existingAccounts, input);

      expect(result).toHaveLength(2);
      expect(result).toEqual(existingAccounts);
    });
  });

  describe("filtering and selection", () => {
    it("should only process selected accounts", () => {
      const items: ImportItem[] = [
        {
          initialAccountId: "js:1:ethereum:0x03:",
          account: newAccount1,
          mode: "create",
        },
        {
          initialAccountId: "js:1:ethereum:0x04:",
          account: newAccount2,
          mode: "create",
        },
      ];

      const syncResult: SyncNewAccountsOutput = {
        synchronized: {
          "js:1:ethereum:0x03:": newAccount1,
          "js:1:ethereum:0x04:": newAccount2,
        },
        failed: {},
      };

      const input: ImportAccountsReduceInput = {
        items,
        selectedAccounts: ["js:1:ethereum:0x03:"], // only first account selected
        syncResult,
      };

      const result = importAccountsReduce(existingAccounts, input);

      expect(result).toHaveLength(3);
      expect(result).toContain(newAccount1);
      expect(result).not.toContain(newAccount2);
    });

    it("should skip accounts not in syncResult.synchronized", () => {
      const items: ImportItem[] = [
        {
          initialAccountId: "js:1:ethereum:0x03:",
          account: newAccount1,
          mode: "create",
        },
        {
          initialAccountId: "js:1:ethereum:0x04:",
          account: newAccount2,
          mode: "create",
        },
      ];

      const syncResult: SyncNewAccountsOutput = {
        synchronized: {
          "js:1:ethereum:0x03:": newAccount1,
          // newAccount2 is missing from synchronized accounts
        },
        failed: {
          "js:1:ethereum:0x04:": new Error("Sync failed"),
        },
      };

      const input: ImportAccountsReduceInput = {
        items,
        selectedAccounts: ["js:1:ethereum:0x03:", "js:1:ethereum:0x04:"],
        syncResult,
      };

      const result = importAccountsReduce(existingAccounts, input);

      expect(result).toHaveLength(3);
      expect(result).toContain(newAccount1);
      expect(result).not.toContain(newAccount2);
    });
  });

  describe("edge cases", () => {
    it("should handle empty inputs", () => {
      const input: ImportAccountsReduceInput = {
        items: [],
        selectedAccounts: [],
        syncResult: { synchronized: {}, failed: {} },
      };

      const result = importAccountsReduce(existingAccounts, input);

      expect(result).toEqual(existingAccounts);
    });

    it("should handle unsupported modes gracefully", () => {
      const items: ImportItem[] = [
        {
          initialAccountId: "js:1:ethereum:0x03:",
          account: newAccount1,
          mode: "unsupported",
        },
      ];

      const syncResult: SyncNewAccountsOutput = {
        synchronized: {
          "js:1:ethereum:0x03:": newAccount1,
        },
        failed: {},
      };

      const input: ImportAccountsReduceInput = {
        items,
        selectedAccounts: ["js:1:ethereum:0x03:"],
        syncResult,
      };

      const result = importAccountsReduce(existingAccounts, input);

      // Should not modify existing accounts for unsupported mode
      expect(result).toEqual(existingAccounts);
    });

    it("should not mutate the original existingAccounts array", () => {
      const originalAccounts = [...existingAccounts];

      const items: ImportItem[] = [
        {
          initialAccountId: "js:1:ethereum:0x03:",
          account: newAccount1,
          mode: "create",
        },
      ];

      const syncResult: SyncNewAccountsOutput = {
        synchronized: {
          "js:1:ethereum:0x03:": newAccount1,
        },
        failed: {},
      };

      const input: ImportAccountsReduceInput = {
        items,
        selectedAccounts: ["js:1:ethereum:0x03:"],
        syncResult,
      };

      const result = importAccountsReduce(existingAccounts, input);

      expect(existingAccounts).toEqual(originalAccounts);
      expect(result).not.toBe(existingAccounts);
    });

    it("should handle mixed create and update operations", () => {
      const items: ImportItem[] = [
        {
          initialAccountId: "js:1:ethereum:0x01:",
          account: existingAccount1,
          mode: "update",
        },
        {
          initialAccountId: "js:1:ethereum:0x03:",
          account: newAccount1,
          mode: "create",
        },
      ];

      const syncResult: SyncNewAccountsOutput = {
        synchronized: {
          "js:1:ethereum:0x01:": updatedAccount1,
          "js:1:ethereum:0x03:": newAccount1,
        },
        failed: {},
      };

      const input: ImportAccountsReduceInput = {
        items,
        selectedAccounts: ["js:1:ethereum:0x01:", "js:1:ethereum:0x03:"],
        syncResult,
      };

      const result = importAccountsReduce(existingAccounts, input);

      expect(result).toHaveLength(3);
      expect(result[0]).toBe(updatedAccount1); // updated
      expect(result[1]).toBe(existingAccount2); // unchanged
      expect(result[2]).toBe(newAccount1); // created
    });
  });
});
