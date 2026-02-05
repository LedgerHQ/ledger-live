import type { ConcordiumResources } from "../types";
import {
  createTestAccount,
  createTestConcordiumAccount,
  createTestAccountRaw,
  createTestConcordiumAccountRaw,
} from "../test/testHelpers";
import { isConcordiumAccount, assignToAccountRaw, assignFromAccountRaw } from "./serialization";

describe("serialization", () => {
  describe("isConcordiumAccount", () => {
    it("should return true for valid Concordium account", () => {
      // GIVEN
      const account = createTestConcordiumAccount({
        concordiumResources: {
          isOnboarded: true,
          credId: "abc",
          publicKey: "def",
          identityIndex: 0,
          credNumber: 0,
          ipIdentity: 0,
        },
      });

      // WHEN
      const result = isConcordiumAccount(account);

      // THEN
      expect(result).toBe(true);
    });

    it("should return false for non-Concordium currency", () => {
      // GIVEN
      const account = createTestAccount({
        currency: {
          ...createTestAccount().currency,
          family: "ethereum",
        },
      });

      // WHEN
      const result = isConcordiumAccount(account);

      // THEN
      expect(result).toBe(false);
    });

    it("should return false when concordiumResources is missing", () => {
      // GIVEN
      const account = createTestAccount();

      // WHEN
      const result = isConcordiumAccount(account);

      // THEN
      expect(result).toBe(false);
    });

    it("should return false when currency is undefined", () => {
      // GIVEN
      const account = createTestAccount({
        currency: undefined,
      });

      // WHEN
      const result = isConcordiumAccount(account);

      // THEN
      expect(result).toBe(false);
    });
  });

  describe("assignToAccountRaw", () => {
    it("should copy concordiumResources to accountRaw", () => {
      // GIVEN
      const resources: ConcordiumResources = {
        isOnboarded: true,
        credId: "cred123",
        publicKey: "pub456",
        identityIndex: 0,
        credNumber: 1,
        ipIdentity: 2,
      };
      const account = createTestConcordiumAccount({ concordiumResources: resources });
      const accountRaw = createTestAccountRaw();

      // WHEN
      assignToAccountRaw(account, accountRaw);

      // THEN
      expect("concordiumResources" in accountRaw).toBe(true);
      if ("concordiumResources" in accountRaw) {
        expect(accountRaw.concordiumResources).toEqual({
          isOnboarded: true,
          credId: "cred123",
          publicKey: "pub456",
          identityIndex: 0,
          credNumber: 1,
          ipIdentity: 2,
        });
      }
    });

    it("should not modify accountRaw when concordiumResources is missing", () => {
      // GIVEN
      const account = createTestAccount();
      const accountRaw = createTestAccountRaw();

      // WHEN
      assignToAccountRaw(account, accountRaw);

      // THEN
      expect("concordiumResources" in accountRaw).toBe(false);
    });

    it("should handle undefined values in resources", () => {
      // GIVEN
      const resources: ConcordiumResources = {
        isOnboarded: false,
        credId: undefined,
        publicKey: undefined,
        identityIndex: undefined,
        credNumber: undefined,
        ipIdentity: undefined,
      };
      const account = createTestConcordiumAccount({ concordiumResources: resources });
      const accountRaw = createTestAccountRaw();

      // WHEN
      assignToAccountRaw(account, accountRaw);

      // THEN
      expect("concordiumResources" in accountRaw).toBe(true);
      if ("concordiumResources" in accountRaw) {
        expect(accountRaw.concordiumResources).not.toBeUndefined();
        expect(accountRaw.concordiumResources?.isOnboarded).toBe(false);
      }
    });
  });

  describe("assignFromAccountRaw", () => {
    it("should copy concordiumResources from accountRaw to account", () => {
      // GIVEN
      const accountRaw = createTestConcordiumAccountRaw({
        concordiumResources: {
          isOnboarded: true,
          credId: "cred789",
          publicKey: "pub012",
          identityIndex: 3,
          credNumber: 4,
          ipIdentity: 5,
        },
      });
      const account = createTestAccount();

      // WHEN
      assignFromAccountRaw(accountRaw, account);

      // THEN
      expect("concordiumResources" in account).toBe(true);
      if ("concordiumResources" in account) {
        expect(account.concordiumResources).toEqual({
          isOnboarded: true,
          credId: "cred789",
          publicKey: "pub012",
          identityIndex: 3,
          credNumber: 4,
          ipIdentity: 5,
        });
      }
    });

    it("should not modify account when concordiumResources is missing in raw", () => {
      // GIVEN
      const accountRaw = createTestAccountRaw();
      const account = createTestAccount();

      // WHEN
      assignFromAccountRaw(accountRaw, account);

      // THEN
      expect("concordiumResources" in account).toBe(false);
    });
  });

  describe("roundtrip serialization", () => {
    it("should preserve all fields through toRaw and fromRaw", () => {
      // GIVEN
      const originalResources: ConcordiumResources = {
        isOnboarded: true,
        credId: "roundtrip-cred",
        publicKey: "roundtrip-key",
        identityIndex: 10,
        credNumber: 20,
        ipIdentity: 30,
      };
      const account = createTestConcordiumAccount({ concordiumResources: originalResources });

      // WHEN
      const accountRaw = createTestAccountRaw();
      assignToAccountRaw(account, accountRaw);
      const restoredAccount = createTestAccount();
      assignFromAccountRaw(accountRaw, restoredAccount);

      // THEN
      expect("concordiumResources" in restoredAccount).toBe(true);
      if ("concordiumResources" in restoredAccount) {
        expect(restoredAccount.concordiumResources).toEqual(originalResources);
      }
    });
  });
});
