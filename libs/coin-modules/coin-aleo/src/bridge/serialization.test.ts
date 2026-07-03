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
import type { AleoAccount, AleoAccountRaw, AleoResources, AleoResourcesRaw } from "../types";
import type { AleoOperationExtraRaw } from "../types/bridge";
import {
  assignFromAccountRaw,
  assignFromTokenAccountRaw,
  assignToAccountRaw,
  assignToTokenAccountRaw,
  toAleoResourcesRaw,
  fromAleoResourcesRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
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
});

describe("operation extra serialization", () => {
  describe("operation extra transitionId round-trip", () => {
    it("preserves transitionId through toOperationExtraRaw/fromOperationExtraRaw", () => {
      const raw = toOperationExtraRaw({
        functionId: "transfer_public",
        transactionType: "public",
        transitionId: "au1roundtrip",
      });
      expect(raw).toMatchObject({ transitionId: "au1roundtrip" });

      const back = fromOperationExtraRaw(raw);
      expect(back).toMatchObject({ transitionId: "au1roundtrip" });
    });

    it("omits transitionId when absent", () => {
      const raw = toOperationExtraRaw({
        functionId: "transfer_public",
        transactionType: "public",
      }) as AleoOperationExtraRaw;
      expect(raw.transitionId).toBeUndefined();
    });
  });
});

describe("staking fields round-trip", () => {
  it("serializes and deserializes staking fields", () => {
    const resources: AleoResources = {
      transparentBalance: new BigNumber(100),
      provableApi: null,
      privateBalance: null,
      unspentPrivateRecords: null,
      lastPrivateSyncDate: null,
      bondedBalance: new BigNumber(5000000),
      bondedValidator: "aleo1validator",
      unbondingBalance: new BigNumber(2000000),
      unbondingHeight: 17655195,
    };

    const raw = toAleoResourcesRaw(resources);
    expect(raw.bondedBalance).toBe("5000000");
    expect(raw.bondedValidator).toBe("aleo1validator");
    expect(raw.unbondingBalance).toBe("2000000");
    expect(raw.unbondingHeight).toBe(17655195);

    const restored = fromAleoResourcesRaw(raw);
    expect(restored.bondedBalance).toEqual(new BigNumber(5000000));
    expect(restored.bondedValidator).toBe("aleo1validator");
    expect(restored.unbondingBalance).toEqual(new BigNumber(2000000));
    expect(restored.unbondingHeight).toBe(17655195);
  });

  it("defaults staking fields when absent from raw (legacy persisted account)", () => {
    const legacyRaw: AleoResourcesRaw = {
      transparentBalance: "100",
      provableApi: null,
      privateBalance: null,
      unspentPrivateRecords: null,
      lastPrivateSyncDate: null,
    };

    const restored = fromAleoResourcesRaw(legacyRaw);
    expect(restored.bondedBalance).toEqual(new BigNumber(0));
    expect(restored.bondedValidator).toBeNull();
    expect(restored.unbondingBalance).toEqual(new BigNumber(0));
    expect(restored.unbondingHeight).toBeNull();
  });
});
