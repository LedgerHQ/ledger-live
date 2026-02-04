import type { TransactionIntent } from "@ledgerhq/coin-framework/api/types";

import { GAS, GAS_PRICE, MIN_GAS_LIMIT } from "../constants";
import { estimateFees } from "./estimateFees";

const TEST_SENDER = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";
const TEST_RECIPIENT = "erd1qyu5wthldzr8wx5c9ucg8kjagg0jfs53s8nr3zpz3hypefsdd8ssycr6th";

describe("estimateFees", () => {
  describe("native EGLD transfer", () => {
    it("should estimate fees for native transfer (AC1)", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const result = estimateFees(intent);

      const expectedFee = BigInt(MIN_GAS_LIMIT) * BigInt(GAS_PRICE);
      expect(result.value).toBe(expectedFee);
      expect(result.parameters?.gasLimit).toBe(BigInt(MIN_GAS_LIMIT));
      expect(result.parameters?.gasPrice).toBe(BigInt(GAS_PRICE));
    });
  });

  describe("ESDT token transfer", () => {
    it("should estimate fees for ESDT transfer (AC2)", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000n,
        asset: { type: "esdt", assetReference: "USDC-c76f1f" },
      };

      const result = estimateFees(intent);

      const expectedFee = BigInt(GAS.ESDT_TRANSFER) * BigInt(GAS_PRICE);
      expect(result.value).toBe(expectedFee);
      expect(result.parameters?.gasLimit).toBe(BigInt(GAS.ESDT_TRANSFER));
      expect(result.parameters?.gasPrice).toBe(BigInt(GAS_PRICE));
    });
  });

  describe("delegation operations", () => {
    it("should estimate fees for delegate operation (AC3)", () => {
      const intent: TransactionIntent = {
        intentType: "staking",
        type: "delegate",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const result = estimateFees(intent);

      const expectedFee = BigInt(GAS.DELEGATE) * BigInt(GAS_PRICE);
      expect(result.value).toBe(expectedFee);
      expect(result.parameters?.gasLimit).toBe(BigInt(GAS.DELEGATE));
      expect(result.parameters?.gasPrice).toBe(BigInt(GAS_PRICE));
    });

    it("should estimate fees for undelegate operation (AC3)", () => {
      const intent: TransactionIntent = {
        intentType: "staking",
        type: "undelegate",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const result = estimateFees(intent);

      const expectedFee = BigInt(GAS.DELEGATE) * BigInt(GAS_PRICE);
      expect(result.value).toBe(expectedFee);
      expect(result.parameters?.gasLimit).toBe(BigInt(GAS.DELEGATE));
      expect(result.parameters?.gasPrice).toBe(BigInt(GAS_PRICE));
    });

    it("should estimate fees for unDelegate operation (case variation)", () => {
      const intent: TransactionIntent = {
        intentType: "staking",
        type: "unDelegate",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const result = estimateFees(intent);

      const expectedFee = BigInt(GAS.DELEGATE) * BigInt(GAS_PRICE);
      expect(result.value).toBe(expectedFee);
      expect(result.parameters?.gasLimit).toBe(BigInt(GAS.DELEGATE));
    });
  });

  describe("claim rewards", () => {
    it("should estimate fees for claimRewards operation (AC3)", () => {
      const intent: TransactionIntent = {
        intentType: "staking",
        type: "claimRewards",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 0n,
        asset: { type: "native" },
      };

      const result = estimateFees(intent);

      const expectedFee = BigInt(GAS.CLAIM) * BigInt(GAS_PRICE);
      expect(result.value).toBe(expectedFee);
      expect(result.parameters?.gasLimit).toBe(BigInt(GAS.CLAIM));
      expect(result.parameters?.gasPrice).toBe(BigInt(GAS_PRICE));
    });

    it("should estimate fees for claim_rewards operation (snake_case variation)", () => {
      const intent: TransactionIntent = {
        intentType: "staking",
        type: "claim_rewards",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 0n,
        asset: { type: "native" },
      };

      const result = estimateFees(intent);

      const expectedFee = BigInt(GAS.CLAIM) * BigInt(GAS_PRICE);
      expect(result.value).toBe(expectedFee);
      expect(result.parameters?.gasLimit).toBe(BigInt(GAS.CLAIM));
    });

    it("should estimate fees for withdraw operation", () => {
      const intent: TransactionIntent = {
        intentType: "staking",
        type: "withdraw",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 0n,
        asset: { type: "native" },
      };

      const result = estimateFees(intent);

      const expectedFee = BigInt(GAS.CLAIM) * BigInt(GAS_PRICE);
      expect(result.value).toBe(expectedFee);
      expect(result.parameters?.gasLimit).toBe(BigInt(GAS.CLAIM));
    });

    it("should estimate fees for reDelegateRewards operation", () => {
      const intent: TransactionIntent = {
        intentType: "staking",
        type: "reDelegateRewards",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 0n,
        asset: { type: "native" },
      };

      const result = estimateFees(intent);

      const expectedFee = BigInt(GAS.CLAIM) * BigInt(GAS_PRICE);
      expect(result.value).toBe(expectedFee);
      expect(result.parameters?.gasLimit).toBe(BigInt(GAS.CLAIM));
    });
  });

  describe("custom fee parameters", () => {
    it("should use custom gas price when provided (AC4)", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const customGasPrice = 2000000000n; // 2 Gwei
      const result = estimateFees(intent, { gasPrice: customGasPrice });

      const expectedFee = BigInt(MIN_GAS_LIMIT) * customGasPrice;
      expect(result.value).toBe(expectedFee);
      expect(result.parameters?.gasPrice).toBe(customGasPrice);
      expect(result.parameters?.gasLimit).toBe(BigInt(MIN_GAS_LIMIT));
    });

    it("should use custom gas limit when provided (AC4)", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const customGasLimit = 100000n;
      const result = estimateFees(intent, { gasLimit: customGasLimit });

      const expectedFee = customGasLimit * BigInt(GAS_PRICE);
      expect(result.value).toBe(expectedFee);
      expect(result.parameters?.gasLimit).toBe(customGasLimit);
      expect(result.parameters?.gasPrice).toBe(BigInt(GAS_PRICE));
    });

    it("should use both custom gas limit and gas price when provided", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const customGasLimit = 100000n;
      const customGasPrice = 2000000000n;
      const result = estimateFees(intent, {
        gasLimit: customGasLimit,
        gasPrice: customGasPrice,
      });

      const expectedFee = customGasLimit * customGasPrice;
      expect(result.value).toBe(expectedFee);
      expect(result.parameters?.gasLimit).toBe(customGasLimit);
      expect(result.parameters?.gasPrice).toBe(customGasPrice);
    });

    it("should override calculated gas limit with custom gas limit for ESDT transfer", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000n,
        asset: { type: "esdt", assetReference: "USDC-c76f1f" },
      };

      const customGasLimit = 600000n;
      const result = estimateFees(intent, { gasLimit: customGasLimit });

      const expectedFee = customGasLimit * BigInt(GAS_PRICE);
      expect(result.value).toBe(expectedFee);
      expect(result.parameters?.gasLimit).toBe(customGasLimit);
      // Should use custom limit, not default ESDT limit
      expect(result.parameters?.gasLimit).not.toBe(BigInt(GAS.ESDT_TRANSFER));
    });
  });

  describe("edge cases", () => {
    it("should throw error for unknown staking type", () => {
      const intent: TransactionIntent = {
        intentType: "staking",
        type: "unknownStakingType",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 0n,
        asset: { type: "native" },
      };

      expect(() => estimateFees(intent)).toThrow(
        'estimateFees failed: unknown staking type "unknownstakingtype"',
      );
    });

    it("should handle zero amount transactions", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 0n,
        asset: { type: "native" },
      };

      const result = estimateFees(intent);

      // Fee should still be calculated based on gas, not amount
      const expectedFee = BigInt(MIN_GAS_LIMIT) * BigInt(GAS_PRICE);
      expect(result.value).toBe(expectedFee);
    });

    it("should use network gas price when provided", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const networkGasPrice = 2000000000n; // 2 Gwei
      const result = estimateFees(intent, undefined, networkGasPrice);

      const expectedFee = BigInt(MIN_GAS_LIMIT) * networkGasPrice;
      expect(result.value).toBe(expectedFee);
      expect(result.parameters?.gasPrice).toBe(networkGasPrice);
    });

    it("should prioritize custom gas price over network gas price", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const networkGasPrice = 2000000000n;
      const customGasPrice = 3000000000n;
      const result = estimateFees(intent, { gasPrice: customGasPrice }, networkGasPrice);

      expect(result.parameters?.gasPrice).toBe(customGasPrice);
      expect(result.parameters?.gasPrice).not.toBe(networkGasPrice);
    });
  });

  describe("input validation", () => {
    it("should throw error if intent is null", () => {
      expect(() => estimateFees(null as any)).toThrow("estimateFees failed: intent is required");
    });

    it("should throw error if intent is undefined", () => {
      expect(() => estimateFees(undefined as any)).toThrow("estimateFees failed: intent is required");
    });

    it("should throw error if intent.intentType is missing", () => {
      const intent = {
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      } as any;

      expect(() => estimateFees(intent)).toThrow("estimateFees failed: intent.intentType is required");
    });

    it("should throw error if intent.type is missing", () => {
      const intent = {
        intentType: "transaction",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      } as any;

      expect(() => estimateFees(intent)).toThrow("estimateFees failed: intent.type is required");
    });

    it("should throw error if intent.asset is missing for transaction intent", () => {
      const intent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
      } as any;

      expect(() => estimateFees(intent)).toThrow("estimateFees failed: intent.asset is required for transaction intents");
    });

    it("should throw error if custom gas price is negative", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      expect(() => estimateFees(intent, { gasPrice: -1n })).toThrow(
        "estimateFees failed: customFeesParameters.gasPrice cannot be negative",
      );
    });

    it("should throw error if custom gas price is zero", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      expect(() => estimateFees(intent, { gasPrice: 0n })).toThrow(
        "estimateFees failed: customFeesParameters.gasPrice cannot be zero",
      );
    });

    it("should throw error if custom gas limit is negative", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      expect(() => estimateFees(intent, { gasLimit: -1n })).toThrow(
        "estimateFees failed: customFeesParameters.gasLimit cannot be negative",
      );
    });

    it("should throw error if custom gas limit is zero", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      expect(() => estimateFees(intent, { gasLimit: 0n })).toThrow(
        "estimateFees failed: customFeesParameters.gasLimit cannot be zero",
      );
    });

    it("should accept custom gas price as number", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const customGasPrice = 2000000000; // number
      const result = estimateFees(intent, { gasPrice: customGasPrice as any });

      expect(result.parameters?.gasPrice).toBe(BigInt(customGasPrice));
    });

    it("should accept custom gas limit as number", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      const customGasLimit = 100000; // number
      const result = estimateFees(intent, { gasLimit: customGasLimit as any });

      expect(result.parameters?.gasLimit).toBe(BigInt(customGasLimit));
    });

    it("should throw error if custom gas price has invalid type", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      expect(() => estimateFees(intent, { gasPrice: {} as any })).toThrow(
        "estimateFees failed: customFeesParameters.gasPrice must be bigint, number, or string",
      );
    });

    it("should throw error if custom gas limit has invalid type", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      expect(() => estimateFees(intent, { gasLimit: {} as any })).toThrow(
        "estimateFees failed: customFeesParameters.gasLimit must be bigint, number, or string",
      );
    });

    it("should throw error if intentType is invalid", () => {
      const intent = {
        intentType: "invalid",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      } as any;

      expect(() => estimateFees(intent)).toThrow(
        'estimateFees failed: invalid intentType "invalid". Expected "transaction" or "staking"',
      );
    });

    it("should throw error if intent.type is not a string", () => {
      const intent = {
        intentType: "transaction",
        type: 123, // number instead of string
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      } as any;

      expect(() => estimateFees(intent)).toThrow(
        "estimateFees failed: intent.type must be a string, got number",
      );
    });

    it("should throw error if intent.type is null", () => {
      const intent = {
        intentType: "transaction",
        type: null,
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      } as any;

      // null is falsy, so it's caught by the "type is required" check first
      expect(() => estimateFees(intent)).toThrow(
        "estimateFees failed: intent.type is required",
      );
    });

    it("should throw error if calculated fee exceeds maximum reasonable value", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      // Use extremely large gas limit that would exceed 1000 EGLD fee
      // MAX_REASONABLE_FEE = 1000000000000000000000n (1000 EGLD)
      // With GAS_PRICE = 1000000000n, we need gasLimit > 1000000000000n
      const extremeGasLimit = BigInt("2000000000000"); // Would produce 2000 EGLD fee
      expect(() => estimateFees(intent, { gasLimit: extremeGasLimit })).toThrow(
        "estimateFees failed: calculated fee",
      );
    });

    it("should accept fees up to maximum reasonable value", () => {
      const intent: TransactionIntent = {
        intentType: "transaction",
        type: "send",
        sender: TEST_SENDER,
        recipient: TEST_RECIPIENT,
        amount: 1000000000000000000n,
        asset: { type: "native" },
      };

      // Use gas limit that produces exactly 1000 EGLD fee (at the limit)
      // MAX_REASONABLE_FEE = 1000000000000000000000n
      // With GAS_PRICE = 1000000000n, gasLimit = 1000000000000n produces exactly 1000 EGLD
      const maxGasLimit = BigInt("1000000000000");
      const result = estimateFees(intent, { gasLimit: maxGasLimit });

      expect(result.value).toBe(BigInt("1000000000000000000000"));
      expect(result.parameters?.gasLimit).toBe(maxGasLimit);
    });
  });
});
