import type { Account, AccountRaw } from "@ledgerhq/types-live";
import type { ConcordiumAccount, ConcordiumAccountRaw, ConcordiumResources } from "../types";
import { isConcordiumAccount, assignToAccountRaw, assignFromAccountRaw } from "./serialization";

describe("serialization", () => {
  describe("isConcordiumAccount", () => {
    it("should return true for valid Concordium account", () => {
      // GIVEN
      const account = {
        currency: { family: "concordium" },
        concordiumResources: {
          isOnboarded: true,
          credId: "abc",
          publicKey: "def",
        },
      } as unknown as Account;

      // WHEN
      const result = isConcordiumAccount(account);

      // THEN
      expect(result).toBe(true);
    });

    it("should return false for non-Concordium currency", () => {
      // GIVEN
      const account = {
        currency: { family: "ethereum" },
        concordiumResources: {},
      } as unknown as Account;

      // WHEN
      const result = isConcordiumAccount(account);

      // THEN
      expect(result).toBe(false);
    });

    it("should return false when concordiumResources is missing", () => {
      // GIVEN
      const account = {
        currency: { family: "concordium" },
      } as unknown as Account;

      // WHEN
      const result = isConcordiumAccount(account);

      // THEN
      expect(result).toBe(false);
    });

    it("should return false when currency is undefined", () => {
      // GIVEN
      const account = {
        concordiumResources: {},
      } as unknown as Account;

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
      const account = { concordiumResources: resources } as ConcordiumAccount;
      const accountRaw = {} as AccountRaw;

      // WHEN
      assignToAccountRaw(account, accountRaw);

      // THEN
      const rawResult = accountRaw as ConcordiumAccountRaw;
      expect(rawResult.concordiumResources).toEqual({
        isOnboarded: true,
        credId: "cred123",
        publicKey: "pub456",
        identityIndex: 0,
        credNumber: 1,
        ipIdentity: 2,
      });
    });

    it("should not modify accountRaw when concordiumResources is missing", () => {
      // GIVEN
      const account = {} as Account;
      const accountRaw = {} as AccountRaw;

      // WHEN
      assignToAccountRaw(account, accountRaw);

      // THEN
      expect((accountRaw as ConcordiumAccountRaw).concordiumResources).toBeUndefined();
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
      const account = { concordiumResources: resources } as ConcordiumAccount;
      const accountRaw = {} as AccountRaw;

      // WHEN
      assignToAccountRaw(account, accountRaw);

      // THEN
      const rawResult = accountRaw as ConcordiumAccountRaw;
      expect(rawResult.concordiumResources).toBeDefined();
      expect(rawResult.concordiumResources?.isOnboarded).toBe(false);
    });
  });

  describe("assignFromAccountRaw", () => {
    it("should copy concordiumResources from accountRaw to account", () => {
      // GIVEN
      const accountRaw = {
        concordiumResources: {
          isOnboarded: true,
          credId: "cred789",
          publicKey: "pub012",
          identityIndex: 3,
          credNumber: 4,
          ipIdentity: 5,
        },
      } as ConcordiumAccountRaw;
      const account = {} as Account;

      // WHEN
      assignFromAccountRaw(accountRaw, account);

      // THEN
      const result = account as ConcordiumAccount;
      expect(result.concordiumResources).toEqual({
        isOnboarded: true,
        credId: "cred789",
        publicKey: "pub012",
        identityIndex: 3,
        credNumber: 4,
        ipIdentity: 5,
      });
    });

    it("should not modify account when concordiumResources is missing in raw", () => {
      // GIVEN
      const accountRaw = {} as AccountRaw;
      const account = {} as Account;

      // WHEN
      assignFromAccountRaw(accountRaw, account);

      // THEN
      expect((account as ConcordiumAccount).concordiumResources).toBeUndefined();
    });

    it("should handle partial resources", () => {
      // GIVEN
      const accountRaw = {
        concordiumResources: {
          isOnboarded: false,
          credId: "only-cred",
        },
      } as ConcordiumAccountRaw;
      const account = {} as Account;

      // WHEN
      assignFromAccountRaw(accountRaw, account);

      // THEN
      const result = account as ConcordiumAccount;
      expect(result.concordiumResources?.credId).toBe("only-cred");
      expect(result.concordiumResources?.isOnboarded).toBe(false);
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
      const account = { concordiumResources: originalResources } as ConcordiumAccount;

      // WHEN
      const accountRaw = {} as AccountRaw;
      assignToAccountRaw(account, accountRaw);
      const restoredAccount = {} as Account;
      assignFromAccountRaw(accountRaw, restoredAccount);

      // THEN
      expect((restoredAccount as ConcordiumAccount).concordiumResources).toEqual(originalResources);
    });
  });
});
