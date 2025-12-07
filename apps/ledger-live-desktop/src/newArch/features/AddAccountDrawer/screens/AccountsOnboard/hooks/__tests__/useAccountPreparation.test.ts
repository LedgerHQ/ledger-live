/* eslint-disable @typescript-eslint/consistent-type-assertions */
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import {
  getCreatableAccount,
  getImportableAccounts,
  prepareAccountsForAdding,
  resolveCreatableAccountName,
} from "../useAccountPreparation";

describe("useAccountPreparation", () => {
  const mockCurrency = {
    id: "canton",
    name: "Canton",
    family: "canton",
    ticker: "CANTON",
    scheme: "canton",
    color: "#000000",
    units: [],
    type: "CryptoCurrency",
  } as unknown as CryptoCurrency;

  const mockAccount1 = {
    id: "account1",
    used: true,
    currency: mockCurrency,
    index: 0,
    type: "Account" as const,
  } as unknown as Account;

  const mockAccount2 = {
    id: "account2",
    used: false,
    currency: mockCurrency,
    index: 1,
    type: "Account" as const,
  } as unknown as Account;

  describe("getImportableAccounts", () => {
    it("should return only accounts with used=true", () => {
      const accounts = [mockAccount1, mockAccount2];
      const result = getImportableAccounts(accounts);
      expect(result).toEqual([mockAccount1]);
    });

    it("should return empty array when no accounts are used", () => {
      const accounts = [mockAccount2];
      const result = getImportableAccounts(accounts);
      expect(result).toEqual([]);
    });

    it("should return empty array for empty input", () => {
      const result = getImportableAccounts([]);
      expect(result).toEqual([]);
    });
  });

  describe("getCreatableAccount", () => {
    it("should return accountToReonboard when isReonboarding is true", () => {
      const accounts = [mockAccount1, mockAccount2];
      const result = getCreatableAccount(accounts, true, mockAccount1);
      expect(result).toBe(mockAccount1);
    });

    it("should return unused account when not reonboarding", () => {
      const accounts = [mockAccount1, mockAccount2];
      const result = getCreatableAccount(accounts, false);
      expect(result).toBe(mockAccount2);
    });

    it("should return undefined when isReonboarding is true but accountToReonboard is undefined", () => {
      const accounts = [mockAccount1, mockAccount2];
      const result = getCreatableAccount(accounts, true, undefined);
      expect(result).toBeUndefined();
    });

    it("should return undefined when no unused account exists", () => {
      const accounts = [mockAccount1];
      const result = getCreatableAccount(accounts, false);
      expect(result).toBeUndefined();
    });

    it("should return undefined for empty accounts array", () => {
      const result = getCreatableAccount([], false);
      expect(result).toBeUndefined();
    });
  });

  describe("resolveCreatableAccountName", () => {
    it("should return edited name when available", () => {
      const editedNames = { account2: "My Custom Name" };
      const result = resolveCreatableAccountName(
        mockAccount2 as Account,
        mockCurrency as CryptoCurrency,
        editedNames,
        0,
      );
      expect(result).toBe("My Custom Name");
    });

    it("should return default name when no edited name", () => {
      const result = resolveCreatableAccountName(
        mockAccount2 as Account,
        mockCurrency as CryptoCurrency,
        {},
        0,
      );
      // Should use getDefaultAccountName which generates name from currency.name and index
      expect(result).toBe("Canton 2"); // index 1 + 1 = 2
    });

    it("should return currency name with index when creatableAccount is undefined", () => {
      const result = resolveCreatableAccountName(undefined, mockCurrency as CryptoCurrency, {}, 2);
      expect(result).toBe("Canton 3");
    });

    it("should calculate index correctly based on importableAccountsCount", () => {
      const result = resolveCreatableAccountName(undefined, mockCurrency as CryptoCurrency, {}, 5);
      expect(result).toBe("Canton 6");
    });
  });

  describe("prepareAccountsForAdding", () => {
    const completedAccount = {
      id: "completed1",
      used: false,
      currency: mockCurrency,
      index: 2,
      type: "Account" as const,
    } as unknown as Account;

    it("should prepare accounts for reonboarding", () => {
      const config = {
        selectedAccounts: [mockAccount1],
        existingAccounts: [],
        editedNames: { account1: "Renamed Account" },
        isReonboarding: true,
        accountToReonboard: mockAccount1,
        onboardingResult: {
          completedAccount,
        },
      };

      const result = prepareAccountsForAdding(config);
      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].id).toBe(mockAccount1.id);
      // Should merge completedAccount properties but keep original ID
      expect(result.renamings[mockAccount1.id]).toBe("Renamed Account");
    });

    it("should handle reonboarding without completedAccount", () => {
      const config = {
        selectedAccounts: [mockAccount1],
        existingAccounts: [],
        editedNames: { account1: "Renamed Account" },
        isReonboarding: true,
        accountToReonboard: mockAccount1,
      };

      const result = prepareAccountsForAdding(config);
      // Should fall back to new onboarding flow
      expect(result.accounts).toEqual([mockAccount1]);
      expect(result.renamings.account1).toBe("Renamed Account");
    });

    it("should prepare accounts for new onboarding with completed account", () => {
      const config = {
        selectedAccounts: [mockAccount1, mockAccount2],
        existingAccounts: [],
        editedNames: {
          account1: "Importable Account",
          tempId: "New Account Name", // Temporary ID for completed account
        },
        isReonboarding: false,
        onboardingResult: {
          completedAccount,
        },
      };

      const result = prepareAccountsForAdding(config);
      expect(result.accounts).toHaveLength(2);
      expect(result.accounts).toContainEqual(mockAccount1);
      expect(result.accounts).toContainEqual(completedAccount);
      expect(result.renamings.account1).toBe("Importable Account");
    });

    it("should handle temporary account ID names correctly", () => {
      const tempId = "temp-account-id";
      const finalAccountId = "final-account-id";
      const config = {
        selectedAccounts: [mockAccount1],
        existingAccounts: [],
        editedNames: {
          account1: "Importable",
          [tempId]: "Temporary Name",
        },
        isReonboarding: false,
        onboardingResult: {
          completedAccount: {
            ...completedAccount,
            id: finalAccountId,
          } as Account,
        },
      };

      const result = prepareAccountsForAdding(config);
      // Should find the temporary ID name and use it for the completed account
      expect(result.renamings[finalAccountId]).toBe("Temporary Name");
      expect(result.renamings.account1).toBe("Importable");
    });

    it("should prepare accounts without completed account", () => {
      const config = {
        selectedAccounts: [mockAccount1],
        existingAccounts: [],
        editedNames: { account1: "Renamed" },
        isReonboarding: false,
      };

      const result = prepareAccountsForAdding(config);
      expect(result.accounts).toEqual([mockAccount1]);
      expect(result.renamings.account1).toBe("Renamed");
    });

    it("should use default account names when editedNames is empty", () => {
      const config = {
        selectedAccounts: [mockAccount1],
        existingAccounts: [],
        editedNames: {},
        isReonboarding: false,
      };

      const result = prepareAccountsForAdding(config);
      expect(result.accounts).toEqual([mockAccount1]);
      // Should use getDefaultAccountName which generates "Canton 1" (index 0 + 1)
      expect(result.renamings[mockAccount1.id]).toBe("Canton 1");
    });
  });
});
