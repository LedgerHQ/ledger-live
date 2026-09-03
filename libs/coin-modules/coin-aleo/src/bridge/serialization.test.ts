import BigNumber from "bignumber.js";
import {
  getMockedAccount,
  getMockedAccountRaw,
  getMockedTokenAccount,
  getMockedTokenAccountRaw,
  mockAleoResources,
  mockAleoResourcesRaw,
} from "../__tests__/fixtures/account.fixture";
import { getMockedTokenCurrency } from "../__tests__/fixtures/currency.fixture";
import type {
  AleoAccount,
  AleoAccountRaw,
  AleoOperationExtra,
  AleoOperationExtraRaw,
  AleoResources,
  AleoResourcesRaw,
} from "../types";
import {
  assignFromAccountRaw,
  assignFromTokenAccountRaw,
  assignToAccountRaw,
  assignToTokenAccountRaw,
  toAleoResourcesRaw,
  fromAleoResourcesRaw,
  toOperationExtraRaw,
  fromOperationExtraRaw,
} from "./serialization";

describe("serialization", () => {
  let mockedAccount: AleoAccount;
  let mockedAccountRaw: AleoAccountRaw;

  beforeEach(() => {
    mockedAccount = getMockedAccount();
    mockedAccountRaw = getMockedAccountRaw();
  });

  describe("toAleoResourcesRaw", () => {
    it("should serialize AleoResources to raw format", () => {
      const result = toAleoResourcesRaw(mockAleoResources);

      expect(result).toEqual(mockAleoResourcesRaw);
    });

    it("should handle null optional fields", () => {
      const resourcesWithNulls: AleoResources = {
        transparentBalance: mockAleoResources.transparentBalance,
        privateBalance: null,
        provableApi: null,
        lastPrivateSyncDate: null,
        unspentPrivateRecords: null,
      };

      const result = toAleoResourcesRaw(resourcesWithNulls);

      expect(result.privateBalance).toBeNull();
      expect(result.provableApi).toBeNull();
      expect(result.lastPrivateSyncDate).toBeNull();
      expect(result.unspentPrivateRecords).toBeNull();
    });

    it("should serialize hasMigratedPublicTokens when present", () => {
      const result = toAleoResourcesRaw({
        ...mockAleoResources,
        hasMigratedPublicTokens: true,
      });

      expect(result.hasMigratedPublicTokens).toBe(true);
    });

    it("should serialize hasMigratedPrivateTokens when present", () => {
      const result = toAleoResourcesRaw({
        ...mockAleoResources,
        hasMigratedPrivateTokens: true,
      });

      expect(result.hasMigratedPrivateTokens).toBe(true);
    });
  });

  describe("fromAleoResourcesRaw", () => {
    it("should deserialize raw format back to AleoResources", () => {
      const result = fromAleoResourcesRaw(mockAleoResourcesRaw);

      expect(result).toEqual(mockAleoResources);
    });

    it("should handle null optional fields in raw format", () => {
      const rawResourcesWithNulls: AleoResourcesRaw = {
        transparentBalance: mockAleoResourcesRaw.transparentBalance,
        privateBalance: null,
        provableApi: null,
        lastPrivateSyncDate: null,
        unspentPrivateRecords: null,
      };

      const result = fromAleoResourcesRaw(rawResourcesWithNulls);

      expect(result.privateBalance).toBeNull();
      expect(result.provableApi).toBeNull();
      expect(result.lastPrivateSyncDate).toBeNull();
      expect(result.unspentPrivateRecords).toBeNull();
    });

    it("should deserialize hasMigratedPublicTokens when present", () => {
      const result = fromAleoResourcesRaw({
        ...mockAleoResourcesRaw,
        hasMigratedPublicTokens: true,
      });

      expect(result.hasMigratedPublicTokens).toBe(true);
    });

    it("should deserialize hasMigratedPrivateTokens when present", () => {
      const result = fromAleoResourcesRaw({
        ...mockAleoResourcesRaw,
        hasMigratedPrivateTokens: true,
      });

      expect(result.hasMigratedPrivateTokens).toBe(true);
    });
  });

  describe("assignToAccountRaw", () => {
    it("should write serialized resources onto AccountRaw", () => {
      assignToAccountRaw(mockedAccount, mockedAccountRaw);

      expect(mockedAccountRaw.aleoResources).toEqual(mockAleoResourcesRaw);
    });

    it("should not modify AccountRaw when account has no aleoResources", () => {
      const accountWithoutResources = { ...mockedAccount };
      delete accountWithoutResources.aleoResources;

      const accountRawBefore = { ...mockedAccountRaw };

      assignToAccountRaw(accountWithoutResources, mockedAccountRaw);

      expect(mockedAccountRaw.aleoResources).toEqual(accountRawBefore.aleoResources);
    });
  });

  describe("assignFromAccountRaw", () => {
    it("should read and deserialize resources from AccountRaw onto Account", () => {
      // Explicitly set aleoResources on accountRaw to test the deserialization path
      const accountRawWithResources = { ...mockedAccountRaw, aleoResources: mockAleoResourcesRaw };
      const accountWithoutResources = { ...mockedAccount };
      delete accountWithoutResources.aleoResources;

      assignFromAccountRaw(accountRawWithResources, accountWithoutResources);

      expect(accountWithoutResources.aleoResources).toEqual(mockAleoResources);
    });

    it("should not modify Account when accountRaw has no aleoResources", () => {
      const accountRawWithoutResources = { ...mockedAccountRaw };
      delete accountRawWithoutResources.aleoResources;

      const accountBefore = { ...mockedAccount };

      assignFromAccountRaw(accountRawWithoutResources, mockedAccount);

      expect(mockedAccount.aleoResources).toEqual(accountBefore.aleoResources);
    });
  });

  describe("token account serialization", () => {
    it("should round-trip transparentBalance on token sub-accounts", () => {
      const tokenAccount = getMockedTokenAccount(getMockedTokenCurrency(), {
        transparentBalance: new BigNumber(123456),
        balance: new BigNumber(123456),
        spendableBalance: new BigNumber(123456),
      });
      const tokenAccountRaw = getMockedTokenAccountRaw(tokenAccount);

      assignToTokenAccountRaw(tokenAccount, tokenAccountRaw);
      expect(tokenAccountRaw.transparentBalance).toBe("123456");

      const restoredTokenAccount = getMockedTokenAccount();
      assignFromTokenAccountRaw(tokenAccountRaw, restoredTokenAccount);
      expect(restoredTokenAccount.transparentBalance).toEqual(new BigNumber(123456));
    });
  });

  // Both functions whitelist fields explicitly, so a field added to AleoOperationExtra without
  // being registered here is silently dropped when the account is reloaded from disk.
  describe("operation extra round-trip", () => {
    const VALIDATOR = "aleo1q3vx8pet0h7739hx5xlekfxh9kus6qdlxhx9qdkxhh9rnva8q5gsskve3t";

    it("preserves every field of a fully-populated extra", () => {
      const extra: AleoOperationExtra = {
        functionId: "bond_public",
        transactionType: "public",
        patched: true,
        programId: "credits.aleo",
        transitionId: "au1bond",
        validator: VALIDATOR,
        stakedAmount: new BigNumber("2982828466682"),
      };

      expect(fromOperationExtraRaw(toOperationExtraRaw(extra))).toEqual(extra);
    });

    it("keeps a staked amount beyond the JS safe integer range exact", () => {
      const stakedAmount = new BigNumber("123456789012345678901234567890");
      const raw = toOperationExtraRaw({
        functionId: "bond_public",
        transactionType: "public",
        stakedAmount,
      }) as AleoOperationExtraRaw;

      expect(raw.stakedAmount).toBe("123456789012345678901234567890");
      expect((fromOperationExtraRaw(raw) as AleoOperationExtra).stakedAmount).toEqual(stakedAmount);
    });

    it("omits both staking fields when absent rather than writing undefined", () => {
      const raw = toOperationExtraRaw({
        functionId: "transfer_public",
        transactionType: "public",
      }) as AleoOperationExtraRaw;

      expect("validator" in raw).toBe(false);
      expect("stakedAmount" in raw).toBe(false);
      expect(fromOperationExtraRaw(raw)).toEqual({
        functionId: "transfer_public",
        transactionType: "public",
      });
    });
  });
});
