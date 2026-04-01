import { createMockAccount, createMockCantonCurrency } from "../../__tests__/testUtils";
import {
  getCreatableAccount,
  getImportableAccounts,
  resolveCreatableAccountName,
  prepareAccountsForAdding,
  prepareAccountsForReonboarding,
  prepareAccountsForNewOnboarding,
} from "../utils/accountPreparation";

describe("accountPreparation", () => {
  const currency = createMockCantonCurrency();

  describe("getCreatableAccount", () => {
    it("should return the account to reonboard when reonboarding", () => {
      const accountToReonboard = createMockAccount({ id: "reonboard", used: true });
      const selected = [createMockAccount({ id: "other", used: false })];

      const result = getCreatableAccount(selected, true, accountToReonboard);
      expect(result).toBe(accountToReonboard);
    });

    it("should return the first unused account for normal onboarding", () => {
      const unused = createMockAccount({ id: "unused", used: false });
      const used = createMockAccount({ id: "used", used: true });
      const selected = [used, unused];

      const result = getCreatableAccount(selected);
      expect(result).toBe(unused);
    });

    it("should return undefined when no unused accounts exist", () => {
      const used = createMockAccount({ id: "used", used: true });
      const result = getCreatableAccount([used]);
      expect(result).toBeUndefined();
    });
  });

  describe("getImportableAccounts", () => {
    it("should return only used accounts", () => {
      const used = createMockAccount({ id: "used", used: true });
      const unused = createMockAccount({ id: "unused", used: false });

      const result = getImportableAccounts([used, unused]);
      expect(result).toEqual([used]);
    });

    it("should return empty array when no used accounts", () => {
      const unused = createMockAccount({ id: "unused", used: false });
      const result = getImportableAccounts([unused]);
      expect(result).toEqual([]);
    });
  });

  describe("resolveCreatableAccountName", () => {
    it("should use edited name when available", () => {
      const account = createMockAccount({ id: "acc-1" });
      const editedNames = { "acc-1": "My Custom Name" };

      const result = resolveCreatableAccountName(account, currency, editedNames, 0);
      expect(result).toBe("My Custom Name");
    });

    it("should use default account name when no edited name", () => {
      const account = createMockAccount({ id: "acc-1" });

      const result = resolveCreatableAccountName(account, currency, {}, 0);
      expect(result).toBe("Canton 1");
    });

    it("should generate fallback name when no creatable account", () => {
      const result = resolveCreatableAccountName(undefined, currency, {}, 2);
      expect(result).toBe("Canton 3");
    });
  });

  describe("prepareAccountsForReonboarding", () => {
    it("should merge completed account into reonboard account preserving original id", () => {
      const accountToReonboard = createMockAccount({ id: "original-id", freshAddress: "old-addr" });
      const completedAccount = createMockAccount({ id: "new-id", freshAddress: "new-addr" });

      const result = prepareAccountsForReonboarding(accountToReonboard, completedAccount, {});
      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].id).toBe("original-id");
      expect(result.accounts[0].freshAddress).toBe("new-addr");
    });

    it("should use edited name when available", () => {
      const accountToReonboard = createMockAccount({ id: "original-id" });
      const completedAccount = createMockAccount({ id: "new-id" });
      const editedNames = { "original-id": "Custom Name" };

      const result = prepareAccountsForReonboarding(
        accountToReonboard,
        completedAccount,
        editedNames,
      );
      expect(result.renamings["original-id"]).toBe("Custom Name");
    });
  });

  describe("prepareAccountsForNewOnboarding", () => {
    it("should include importable accounts and completed account", () => {
      const importable = createMockAccount({ id: "imp-1", used: true });
      const completed = createMockAccount({ id: "comp-1" });

      const result = prepareAccountsForNewOnboarding([importable], completed, {});
      expect(result.accounts).toHaveLength(2);
      expect(result.accounts[0].id).toBe("imp-1");
      expect(result.accounts[1].id).toBe("comp-1");
    });

    it("should handle no completed account", () => {
      const importable = createMockAccount({ id: "imp-1", used: true });

      const result = prepareAccountsForNewOnboarding([importable], undefined, {});
      expect(result.accounts).toHaveLength(1);
    });

    it("should resolve editedNames for completed account using temporary ID", () => {
      const importable = createMockAccount({ id: "imp-1", used: true });
      const completed = createMockAccount({ id: "comp-1" });
      const editedNames = { "imp-1": "Imported", "temp-id": "My New Account" };

      const result = prepareAccountsForNewOnboarding([importable], completed, editedNames);
      expect(result.renamings["imp-1"]).toBe("Imported");
      expect(result.renamings["comp-1"]).toBe("My New Account");
    });
  });

  describe("prepareAccountsForAdding", () => {
    it("should delegate to reonboarding path when reonboarding", () => {
      const accountToReonboard = createMockAccount({ id: "reonboard", used: true });
      const completedAccount = createMockAccount({ id: "completed" });

      const result = prepareAccountsForAdding({
        selectedAccounts: [accountToReonboard],
        editedNames: {},
        isReonboarding: true,
        accountToReonboard,
        onboardingResult: { completedAccount },
      });

      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].id).toBe("reonboard");
    });

    it("should delegate to new onboarding path otherwise", () => {
      const used = createMockAccount({ id: "used", used: true });
      const unused = createMockAccount({ id: "unused", used: false });
      const completed = createMockAccount({ id: "completed" });

      const result = prepareAccountsForAdding({
        selectedAccounts: [used, unused],
        editedNames: {},
        onboardingResult: { completedAccount: completed },
      });

      expect(result.accounts).toHaveLength(2);
      expect(result.accounts[0].id).toBe("used");
      expect(result.accounts[1].id).toBe("completed");
    });
  });
});
