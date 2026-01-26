import type { Account, AccountRaw } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import {
  assignToAccountRaw,
  assignFromAccountRaw,
  fromOperationExtraRaw,
  toOperationExtraRaw,
} from "./serialization";
import type {
  AlgorandAccount,
  AlgorandAccountRaw,
  AlgorandOperationExtra,
  AlgorandOperationExtraRaw,
} from "./types";

describe("serialization", () => {
  describe("assignToAccountRaw", () => {
    it("should assign algorandResources to account raw", () => {
      const account = {
        algorandResources: {
          rewards: new BigNumber("5000000"),
          nbAssets: 3,
        },
      } as AlgorandAccount;

      const accountRaw = {} as AccountRaw;

      assignToAccountRaw(account as Account, accountRaw);

      const algorandRaw = accountRaw as AlgorandAccountRaw;
      expect(algorandRaw.algorandResources).not.toBeUndefined();
      expect(algorandRaw.algorandResources?.rewards).toBe("5000000");
      expect(algorandRaw.algorandResources?.nbAssets).toBe(3);
    });

    it("should not assign if algorandResources is undefined", () => {
      const account = {} as AlgorandAccount;
      const accountRaw = {} as AccountRaw;

      assignToAccountRaw(account as Account, accountRaw);

      const algorandRaw = accountRaw as AlgorandAccountRaw;
      expect(algorandRaw.algorandResources).toBeUndefined();
    });

    it("should handle zero rewards", () => {
      const account = {
        algorandResources: {
          rewards: new BigNumber("0"),
          nbAssets: 0,
        },
      } as AlgorandAccount;

      const accountRaw = {} as AccountRaw;

      assignToAccountRaw(account as Account, accountRaw);

      const algorandRaw = accountRaw as AlgorandAccountRaw;
      expect(algorandRaw.algorandResources?.rewards).toBe("0");
      expect(algorandRaw.algorandResources?.nbAssets).toBe(0);
    });
  });

  describe("assignFromAccountRaw", () => {
    it("should assign algorandResources from account raw", () => {
      const accountRaw = {
        algorandResources: {
          rewards: "10000000",
          nbAssets: 5,
        },
      } as AlgorandAccountRaw;

      const account = {} as Account;

      assignFromAccountRaw(accountRaw as AccountRaw, account);

      const algorandAccount = account as AlgorandAccount;
      expect(algorandAccount.algorandResources).not.toBeUndefined();
      expect(algorandAccount.algorandResources?.rewards).toBeInstanceOf(BigNumber);
      expect(algorandAccount.algorandResources?.rewards.toString()).toBe("10000000");
      expect(algorandAccount.algorandResources?.nbAssets).toBe(5);
    });

    it("should not assign if algorandResources is undefined", () => {
      const accountRaw = {} as AlgorandAccountRaw;
      const account = {} as Account;

      assignFromAccountRaw(accountRaw as AccountRaw, account);

      const algorandAccount = account as AlgorandAccount;
      expect(algorandAccount.algorandResources).toBeUndefined();
    });
  });

  describe("round-trip account serialization", () => {
    it("should preserve data through toRaw and fromRaw", () => {
      const originalAccount = {
        algorandResources: {
          rewards: new BigNumber("7500000"),
          nbAssets: 10,
        },
      } as AlgorandAccount;

      const accountRaw = {} as AccountRaw;
      assignToAccountRaw(originalAccount as Account, accountRaw);

      const restoredAccount = {} as Account;
      assignFromAccountRaw(accountRaw, restoredAccount);

      const restored = restoredAccount as AlgorandAccount;
      expect(restored.algorandResources?.rewards.toString()).toBe(
        originalAccount.algorandResources.rewards.toString(),
      );
      expect(restored.algorandResources?.nbAssets).toBe(originalAccount.algorandResources.nbAssets);
    });
  });

  describe("fromOperationExtraRaw", () => {
    it("should convert operation extra raw with all fields", () => {
      const extraRaw: AlgorandOperationExtraRaw = {
        rewards: "1000000",
        memo: "test memo",
        assetId: "12345",
      };

      const result = fromOperationExtraRaw(extraRaw);

      expect(result.rewards).toBeInstanceOf(BigNumber);
      expect(result.rewards?.toString()).toBe("1000000");
      expect(result.memo).toBe("test memo");
      expect(result.assetId).toBe("12345");
    });

    it("should handle partial extra raw with only rewards", () => {
      const extraRaw: AlgorandOperationExtraRaw = {
        rewards: "500000",
      };

      const result = fromOperationExtraRaw(extraRaw);

      expect(result.rewards?.toString()).toBe("500000");
      expect(result.memo).toBeUndefined();
      expect(result.assetId).toBeUndefined();
    });

    it("should handle partial extra raw with only memo", () => {
      const extraRaw: AlgorandOperationExtraRaw = {
        memo: "just a memo",
      };

      const result = fromOperationExtraRaw(extraRaw);

      expect(result.rewards).toBeUndefined();
      expect(result.memo).toBe("just a memo");
      expect(result.assetId).toBeUndefined();
    });

    it("should handle partial extra raw with only assetId", () => {
      const extraRaw: AlgorandOperationExtraRaw = {
        assetId: "67890",
      };

      const result = fromOperationExtraRaw(extraRaw);

      expect(result.rewards).toBeUndefined();
      expect(result.memo).toBeUndefined();
      expect(result.assetId).toBe("67890");
    });

    it("should return empty object for non-algorand extra", () => {
      const extraRaw = { someOtherField: "value" };

      const result = fromOperationExtraRaw(extraRaw);

      expect(result).toEqual({});
    });
  });

  describe("toOperationExtraRaw", () => {
    it("should convert operation extra with all fields", () => {
      const extra: AlgorandOperationExtra = {
        rewards: new BigNumber("2000000"),
        memo: "outgoing memo",
        assetId: "11111",
      };

      const result = toOperationExtraRaw(extra);

      expect(result.rewards).toBe("2000000");
      expect(result.memo).toBe("outgoing memo");
      expect(result.assetId).toBe("11111");
    });

    it("should handle partial extra with only rewards", () => {
      const extra: AlgorandOperationExtra = {
        rewards: new BigNumber("750000"),
      };

      const result = toOperationExtraRaw(extra);

      expect(result.rewards).toBe("750000");
      expect(result.memo).toBeUndefined();
      expect(result.assetId).toBeUndefined();
    });

    it("should handle partial extra with only memo", () => {
      const extra: AlgorandOperationExtra = {
        memo: "only memo here",
      };

      const result = toOperationExtraRaw(extra);

      expect(result.rewards).toBeUndefined();
      expect(result.memo).toBe("only memo here");
      expect(result.assetId).toBeUndefined();
    });

    it("should return empty object for non-algorand extra", () => {
      const extra = { someOtherField: "value" };

      const result = toOperationExtraRaw(extra);

      expect(result).toEqual({});
    });
  });

  describe("round-trip operation extra serialization", () => {
    it("should preserve data through toRaw and fromRaw", () => {
      const original: AlgorandOperationExtra = {
        rewards: new BigNumber("3000000"),
        memo: "round trip memo",
        assetId: "99999",
      };

      const raw = toOperationExtraRaw(original);
      const restored = fromOperationExtraRaw(raw);

      expect(restored.rewards?.toString()).toBe(original.rewards?.toString());
      expect(restored.memo).toBe(original.memo);
      expect(restored.assetId).toBe(original.assetId);
    });
  });
});
