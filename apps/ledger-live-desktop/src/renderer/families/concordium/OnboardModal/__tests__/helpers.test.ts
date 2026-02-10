import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import { ConcordiumPairingStatus } from "@ledgerhq/coin-concordium";
import {
  getCreatableAccount,
  getImportableAccounts,
  resolveAccountName,
  resolveCreatableAccountName,
  prepareAccountsForNewOnboarding,
  prepareAccountsForAdding,
  getConfirmationCode,
  shouldRetryPairing,
  handlePairingProgress,
  handleOnboardingProgress,
  MAX_EXPIRED_RETRIES,
} from "../helpers";
import { createMockAccount, createMockConcordiumCurrency } from "./testUtils";

jest.mock("@ledgerhq/live-wallet/accountName", () => ({
  getDefaultAccountName: jest.fn((account: { id: string }) => `Default ${account.id}`),
}));

describe("OnboardModal helpers", () => {
  const mockCurrency = createMockConcordiumCurrency();

  describe("getCreatableAccount", () => {
    it("returns the first unused account", () => {
      const unusedAccount = createMockAccount({ id: "unused", used: false });
      const usedAccount = createMockAccount({ id: "used", used: true });

      const result = getCreatableAccount([usedAccount, unusedAccount]);

      expect(result).toBe(unusedAccount);
    });

    it("returns undefined when all accounts are used", () => {
      const usedAccount1 = createMockAccount({ id: "used1", used: true });
      const usedAccount2 = createMockAccount({ id: "used2", used: true });

      const result = getCreatableAccount([usedAccount1, usedAccount2]);

      expect(result).toBeUndefined();
    });

    it("returns undefined for empty array", () => {
      const result = getCreatableAccount([]);

      expect(result).toBeUndefined();
    });
  });

  describe("getImportableAccounts", () => {
    it("returns only used accounts", () => {
      const unusedAccount = createMockAccount({ id: "unused", used: false });
      const usedAccount1 = createMockAccount({ id: "used1", used: true });
      const usedAccount2 = createMockAccount({ id: "used2", used: true });

      const result = getImportableAccounts([unusedAccount, usedAccount1, usedAccount2]);

      expect(result).toHaveLength(2);
      expect(result).toContain(usedAccount1);
      expect(result).toContain(usedAccount2);
      expect(result).not.toContain(unusedAccount);
    });

    it("returns empty array when no accounts are used", () => {
      const unusedAccount = createMockAccount({ id: "unused", used: false });

      const result = getImportableAccounts([unusedAccount]);

      expect(result).toHaveLength(0);
    });
  });

  describe("resolveAccountName", () => {
    it("returns edited name when available", () => {
      const account = createMockAccount({ id: "acc1" });
      const editedNames = { acc1: "Custom Name" };

      const result = resolveAccountName(account, editedNames);

      expect(result).toBe("Custom Name");
    });

    it("returns default name when no edited name", () => {
      const account = createMockAccount({ id: "acc1" });

      const result = resolveAccountName(account, {});

      expect(result).toBe("Default acc1");
    });
  });

  describe("resolveCreatableAccountName", () => {
    it("returns currency name with index when no creatable account", () => {
      const result = resolveCreatableAccountName(undefined, mockCurrency, {}, 2);

      expect(result).toBe("Concordium 3");
    });

    it("returns account name when creatable account exists", () => {
      const account = createMockAccount({ id: "acc1" });

      const result = resolveCreatableAccountName(account, mockCurrency, {}, 0);

      expect(result).toBe("Default acc1");
    });

    it("returns edited name when available for creatable account", () => {
      const account = createMockAccount({ id: "acc1" });
      const editedNames = { acc1: "Edited Name" };

      const result = resolveCreatableAccountName(account, mockCurrency, editedNames, 0);

      expect(result).toBe("Edited Name");
    });
  });

  describe("prepareAccountsForNewOnboarding", () => {
    it("includes completed account in result", () => {
      const importable = createMockAccount({ id: "imp1", used: true });
      const completed = createMockAccount({ id: "comp1", used: false });

      const result = prepareAccountsForNewOnboarding([importable], completed, {});

      expect(result.accounts).toHaveLength(2);
      expect(result.accounts).toContain(completed);
    });

    it("handles case without completed account", () => {
      const importable = createMockAccount({ id: "imp1", used: true });

      const result = prepareAccountsForNewOnboarding([importable], undefined, {});

      expect(result.accounts).toHaveLength(1);
    });

    it("applies edited names to renamings", () => {
      const importable = createMockAccount({ id: "imp1" });
      const editedNames = { imp1: "Custom Name" };

      const result = prepareAccountsForNewOnboarding([importable], undefined, editedNames);

      expect(result.renamings.imp1).toBe("Custom Name");
    });

    it("applies completed account name from temporary ID", () => {
      const importable = createMockAccount({ id: "imp1", used: true });
      const completed = createMockAccount({ id: "comp1" });
      const editedNames = { tempId: "Onboarded Account Name" };

      const result = prepareAccountsForNewOnboarding([importable], completed, editedNames);

      expect(result.renamings.comp1).toBe("Onboarded Account Name");
    });
  });

  describe("prepareAccountsForAdding", () => {
    it("prepares accounts with onboarding result", () => {
      const usedAccount = createMockAccount({ id: "used1", used: true });
      const unusedAccount = createMockAccount({ id: "unused1", used: false });
      const completedAccount = createMockAccount({ id: "completed1" });

      const result = prepareAccountsForAdding({
        selectedAccounts: [usedAccount, unusedAccount],
        editedNames: {},
        onboardingResult: { completedAccount },
      });

      expect(result.accounts).toHaveLength(2);
      expect(result.accounts).toContain(usedAccount);
      expect(result.accounts).toContain(completedAccount);
    });

    it("prepares accounts without onboarding result", () => {
      const usedAccount = createMockAccount({ id: "used1", used: true });

      const result = prepareAccountsForAdding({
        selectedAccounts: [usedAccount],
        editedNames: {},
      });

      expect(result.accounts).toHaveLength(1);
    });
  });

  describe("getConfirmationCode", () => {
    it("returns first 4 characters uppercase", () => {
      expect(getConfirmationCode("abcdef")).toBe("ABCD");
    });

    it("returns exactly 4 characters when input is exactly 4", () => {
      expect(getConfirmationCode("abcd")).toBe("ABCD");
    });

    it("throws on short strings", () => {
      expect(() => getConfirmationCode("ab")).toThrow(
        "Invalid sessionTopic: expected at least 4 characters, got 2",
      );
    });

    it("throws on empty string", () => {
      expect(() => getConfirmationCode("")).toThrow(
        "Invalid sessionTopic: expected at least 4 characters, got 0",
      );
    });

    it("uppercases mixed case input", () => {
      expect(getConfirmationCode("AbCdEf")).toBe("ABCD");
    });
  });

  describe("shouldRetryPairing", () => {
    it("returns true for expired error under retry limit", () => {
      const error = new Error("Session expired");

      expect(shouldRetryPairing(error, 0)).toBe(true);
      expect(shouldRetryPairing(error, 1)).toBe(true);
      expect(shouldRetryPairing(error, 2)).toBe(true);
    });

    it("returns false when retry limit reached", () => {
      const error = new Error("Session expired");

      expect(shouldRetryPairing(error, MAX_EXPIRED_RETRIES)).toBe(false);
    });

    it("returns false for non-expired errors", () => {
      const error = new Error("Connection failed");

      expect(shouldRetryPairing(error, 0)).toBe(false);
    });

    it("handles string errors", () => {
      expect(shouldRetryPairing("expired", 0)).toBe(true);
      expect(shouldRetryPairing("other error", 0)).toBe(false);
    });

    it("handles null/undefined errors", () => {
      expect(shouldRetryPairing(null, 0)).toBe(false);
      expect(shouldRetryPairing(undefined, 0)).toBe(false);
    });
  });

  describe("handlePairingProgress", () => {
    it("returns state update for PREPARE status with walletConnectUri", () => {
      const data = {
        status: ConcordiumPairingStatus.PREPARE,
        walletConnectUri: "wc:test-uri",
      };

      const result = handlePairingProgress(data);

      expect(result).toEqual({
        onboardingStatus: AccountOnboardStatus.PREPARE,
        walletConnectUri: "wc:test-uri",
      });
    });

    it("returns null for PREPARE status without walletConnectUri", () => {
      const data = {
        status: ConcordiumPairingStatus.PREPARE,
      };

      const result = handlePairingProgress(data as never);

      expect(result).toBeNull();
    });

    it("returns state update for SUCCESS status with sessionTopic", () => {
      const data = {
        status: ConcordiumPairingStatus.SUCCESS,
        sessionTopic: "test-session-topic",
      };

      const result = handlePairingProgress(data);

      expect(result).toEqual({
        isPairing: false,
        onboardingStatus: AccountOnboardStatus.SUCCESS,
        sessionTopic: "test-session-topic",
        walletConnectUri: null,
      });
    });

    it("returns null for SUCCESS status without sessionTopic", () => {
      const data = {
        status: ConcordiumPairingStatus.SUCCESS,
      };

      const result = handlePairingProgress(data as never);

      expect(result).toBeNull();
    });

    it("returns null for unknown status", () => {
      const data = {
        status: "UNKNOWN" as ConcordiumPairingStatus,
      };

      const result = handlePairingProgress(data);

      expect(result).toBeNull();
    });
  });

  describe("handleOnboardingProgress", () => {
    it("returns state update for SIGN status", () => {
      const data = {
        status: AccountOnboardStatus.SIGN,
      };

      const result = handleOnboardingProgress(data);

      expect(result).toEqual({
        onboardingStatus: AccountOnboardStatus.SIGN,
      });
    });

    it("returns state update for SUBMIT status", () => {
      const data = {
        status: AccountOnboardStatus.SUBMIT,
      };

      const result = handleOnboardingProgress(data);

      expect(result).toEqual({
        onboardingStatus: AccountOnboardStatus.SUBMIT,
      });
    });

    it("returns state update with completed account", () => {
      const completedAccount = createMockAccount({ id: "completed" });
      const data = {
        account: completedAccount,
      };

      const result = handleOnboardingProgress(data);

      expect(result).toEqual({
        onboardingResult: {
          completedAccount,
        },
        onboardingStatus: AccountOnboardStatus.SUCCESS,
        isProcessing: false,
      });
    });

    it("returns null for unknown progress type", () => {
      const data = {
        someOtherField: "value",
      };

      const result = handleOnboardingProgress(data as never);

      expect(result).toBeNull();
    });

    it("returns null for PREPARE status", () => {
      const data = {
        status: AccountOnboardStatus.PREPARE,
      };

      const result = handleOnboardingProgress(data);

      expect(result).toBeNull();
    });
  });
});
