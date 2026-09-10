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
import {
  assignFromAccountRaw,
  assignFromTokenAccountRaw,
  assignToAccountRaw,
  assignToTokenAccountRaw,
  toAleoResourcesRaw,
  fromAleoResourcesRaw,
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

  describe("staking position round-trip", () => {
    const stakedResources: AleoResources = {
      ...mockAleoResources,
      bondedBalance: new BigNumber("12500000000"),
      bondedValidator: "aleo1validator",
      unbondingBalance: new BigNumber("3000000"),
      unbondingHeight: 987654,
    };

    it("preserves a fully-populated staking position", () => {
      const result = fromAleoResourcesRaw(toAleoResourcesRaw(stakedResources));

      expect(result).toEqual(stakedResources);
    });

    it("leaves the staking fields absent on an account persisted before they existed", () => {
      // The four fields are absent from every cached account written before this change, and
      // absent is not the same as zeroed: it means the mappings were never read.
      const rawWithoutStaking: AleoResourcesRaw = {
        transparentBalance: mockAleoResourcesRaw.transparentBalance,
        privateBalance: mockAleoResourcesRaw.privateBalance,
        provableApi: mockAleoResourcesRaw.provableApi,
        lastPrivateSyncDate: mockAleoResourcesRaw.lastPrivateSyncDate,
        unspentPrivateRecords: mockAleoResourcesRaw.unspentPrivateRecords,
      };

      const result = fromAleoResourcesRaw(rawWithoutStaking);

      expect(result).not.toHaveProperty("bondedBalance");
      expect(result).not.toHaveProperty("bondedValidator");
      expect(result).not.toHaveProperty("unbondingBalance");
      expect(result).not.toHaveProperty("unbondingHeight");
    });

    it("omits the staking fields when the position was never synced", () => {
      // Same invariant on the way out: a staking-disabled account must not grow the fields
      // on its first persist/restore.
      const {
        bondedBalance: _b,
        bondedValidator: _v,
        unbondingBalance: _u,
        unbondingHeight: _h,
        ...withoutStaking
      } = mockAleoResources;

      const raw = toAleoResourcesRaw(withoutStaking);

      expect(raw).not.toHaveProperty("bondedBalance");
      expect(raw).not.toHaveProperty("bondedValidator");
      expect(raw).not.toHaveProperty("unbondingBalance");
      expect(raw).not.toHaveProperty("unbondingHeight");
      expect(fromAleoResourcesRaw(raw)).toEqual(withoutStaking);
    });

    it("keeps a zeroed position that was actually synced", () => {
      // enableStaking on with nothing bonded: the zeros are a real reading, not an absence.
      const raw = toAleoResourcesRaw({
        ...mockAleoResources,
        bondedBalance: new BigNumber(0),
        bondedValidator: null,
        unbondingBalance: new BigNumber(0),
        unbondingHeight: null,
      });

      expect(raw.bondedBalance).toBe("0");
      expect(raw.unbondingBalance).toBe("0");
      expect(raw.bondedValidator).toBeNull();
      expect(raw.unbondingHeight).toBeNull();
    });

    it("keeps a bonded balance beyond the JS safe integer range exact", () => {
      const huge = "9007199254740993000";

      const result = fromAleoResourcesRaw(
        toAleoResourcesRaw({ ...mockAleoResources, bondedBalance: new BigNumber(huge) }),
      );

      expect(result.bondedBalance?.toFixed()).toBe(huge);
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
