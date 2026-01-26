import { Balance, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import { BigNumber } from "bignumber.js";
import * as network from "../network";
import type { AlgorandMemo } from "../types";
import { validateIntent } from "./validateIntent";

jest.mock("../network");
jest.mock("./validateAddress", () => ({
  validateAddress: jest.fn().mockReturnValue(true),
}));

const mockGetAccount = network.getAccount as jest.MockedFunction<typeof network.getAccount>;

describe("validateIntent", () => {
  const validSender = "SENDER_ADDRESS_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const validRecipient = "RECIPIENT_ADDRESS_BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";

  const defaultBalances: Balance[] = [
    {
      value: 10000000n, // 10 ALGO
      asset: { type: "native" },
      locked: 100000n, // 0.1 ALGO minimum
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccount.mockResolvedValue({
      balance: new BigNumber("1000000"),
      pendingRewards: new BigNumber("0"),
      assets: [],
    });
  });

  describe("recipient validation", () => {
    it("should error when recipient is empty", async () => {
      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: "",
        amount: 1000000n,
        asset: { type: "native" },
        useAllAmount: false,
      };

      const result = await validateIntent(intent, defaultBalances);

      expect(result.errors.recipient).not.toBeUndefined();
      expect(result.errors.recipient?.message).toBe("RecipientRequired");
    });

    it("should error when sender equals recipient", async () => {
      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: validSender,
        amount: 1000000n,
        asset: { type: "native" },
        useAllAmount: false,
      };

      const result = await validateIntent(intent, defaultBalances);

      expect(result.errors.recipient).not.toBeUndefined();
      expect(result.errors.recipient?.message).toBe("InvalidAddressBecauseDestinationIsAlsoSource");
    });
  });

  describe("amount validation", () => {
    it("should error when amount is 0 and not useAllAmount", async () => {
      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: validRecipient,
        amount: 0n,
        asset: { type: "native" },
        useAllAmount: false,
      };

      const result = await validateIntent(intent, defaultBalances);

      expect(result.errors.amount).not.toBeUndefined();
      expect(result.errors.amount?.message).toBe("AmountRequired");
    });

    it("should error when amount exceeds spendable balance", async () => {
      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: validRecipient,
        amount: 100000000n, // 100 ALGO
        asset: { type: "native" },
        useAllAmount: false,
      };

      const result = await validateIntent(intent, defaultBalances, { value: 1000n });

      expect(result.errors.amount).not.toBeUndefined();
      expect(result.errors.amount?.message).toBe("NotEnoughBalance");
    });

    it("should calculate max spendable when useAllAmount is true", async () => {
      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: validRecipient,
        amount: 0n,
        asset: { type: "native" },
        useAllAmount: true,
      };

      const result = await validateIntent(intent, defaultBalances, { value: 1000n });

      // 10 ALGO - 0.1 ALGO locked - 0.001 ALGO fees = 9.899 ALGO
      expect(result.amount).toBe(9899000n);
    });
  });

  describe("token transfer validation", () => {
    it("should error when token not found in account", async () => {
      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: validRecipient,
        amount: 100n,
        asset: { type: "asa", assetReference: "unknown_token" },
        useAllAmount: false,
      };

      const result = await validateIntent(intent, defaultBalances);

      expect(result.errors.amount).not.toBeUndefined();
      expect(result.errors.amount?.message).toBe("NotEnoughBalance");
    });

    it("should validate token transfer with sufficient balance", async () => {
      mockGetAccount.mockResolvedValue({
        balance: new BigNumber("1000000"),
        pendingRewards: new BigNumber("0"),
        assets: [{ assetId: "123", amount: new BigNumber("1000") }],
      });

      const balancesWithToken: Balance[] = [
        ...defaultBalances,
        {
          value: 1000n,
          asset: { type: "asa", assetReference: "123" },
        },
      ];

      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: validRecipient,
        amount: 500n,
        asset: { type: "asa", assetReference: "123" },
        useAllAmount: false,
      };

      const result = await validateIntent(intent, balancesWithToken, { value: 1000n });

      expect(result.errors.amount).toBeUndefined();
      expect(result.errors.recipient).toBeUndefined();
    });

    it("should error when token balance is insufficient", async () => {
      mockGetAccount.mockResolvedValue({
        balance: new BigNumber("1000000"),
        pendingRewards: new BigNumber("0"),
        assets: [{ assetId: "123", amount: new BigNumber("100") }],
      });

      const balancesWithToken: Balance[] = [
        ...defaultBalances,
        {
          value: 100n,
          asset: { type: "asa", assetReference: "123" },
        },
      ];

      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: validRecipient,
        amount: 500n,
        asset: { type: "asa", assetReference: "123" },
        useAllAmount: false,
      };

      const result = await validateIntent(intent, balancesWithToken, { value: 1000n });

      expect(result.errors.amount).not.toBeUndefined();
      expect(result.errors.amount?.message).toBe("NotEnoughBalance");
    });

    it("should error when recipient has not opted in to ASA token", async () => {
      mockGetAccount.mockResolvedValue({
        balance: new BigNumber("1000000"),
        pendingRewards: new BigNumber("0"),
        assets: [], // Recipient has no assets - not opted in
      });

      const balancesWithToken: Balance[] = [
        ...defaultBalances,
        {
          value: 1000n,
          asset: { type: "asa", assetReference: "123" },
        },
      ];

      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: validRecipient,
        amount: 500n,
        asset: { type: "asa", assetReference: "123" },
        useAllAmount: false,
      };

      const result = await validateIntent(intent, balancesWithToken, { value: 1000n });

      expect(result.errors.recipient).not.toBeUndefined();
      expect(result.errors.recipient?.message).toBe("AlgorandASANotOptInInRecipient");
    });

    it("should error when recipient has opted in to different ASA token", async () => {
      mockGetAccount.mockResolvedValue({
        balance: new BigNumber("1000000"),
        pendingRewards: new BigNumber("0"),
        assets: [{ assetId: "456", amount: new BigNumber("1000") }], // Different token
      });

      const balancesWithToken: Balance[] = [
        ...defaultBalances,
        {
          value: 1000n,
          asset: { type: "asa", assetReference: "123" },
        },
      ];

      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: validRecipient,
        amount: 500n,
        asset: { type: "asa", assetReference: "123" },
        useAllAmount: false,
      };

      const result = await validateIntent(intent, balancesWithToken, { value: 1000n });

      expect(result.errors.recipient).not.toBeUndefined();
      expect(result.errors.recipient?.message).toBe("AlgorandASANotOptInInRecipient");
    });

    it("should error when recipient account does not exist for ASA transfer", async () => {
      mockGetAccount.mockRejectedValue(new Error("Account not found"));

      const balancesWithToken: Balance[] = [
        ...defaultBalances,
        {
          value: 1000n,
          asset: { type: "asa", assetReference: "123" },
        },
      ];

      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: validRecipient,
        amount: 500n,
        asset: { type: "asa", assetReference: "123" },
        useAllAmount: false,
      };

      const result = await validateIntent(intent, balancesWithToken, { value: 1000n });

      expect(result.errors.recipient).not.toBeUndefined();
      expect(result.errors.recipient?.message).toBe("AlgorandASANotOptInInRecipient");
    });
  });

  describe("new account validation", () => {
    it("should error when sending less than minimum to new account", async () => {
      mockGetAccount.mockResolvedValue({
        balance: new BigNumber("0"),
        pendingRewards: new BigNumber("0"),
        assets: [],
      });

      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: validRecipient,
        amount: 50000n, // Less than 0.1 ALGO
        asset: { type: "native" },
        useAllAmount: false,
      };

      const result = await validateIntent(intent, defaultBalances, { value: 1000n });

      expect(result.errors.amount).not.toBeUndefined();
      expect(result.errors.amount?.message).toBe("NotEnoughBalanceBecauseDestinationNotCreated");
    });
  });

  describe("memo validation", () => {
    it("should error when memo exceeds max size", async () => {
      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: validRecipient,
        amount: 1000000n,
        asset: { type: "native" },
        useAllAmount: false,
        memo: { type: "string", kind: "note", value: "a".repeat(2000) },
      };

      const result = await validateIntent(intent, defaultBalances);

      expect(result.errors.transaction).not.toBeUndefined();
      expect(result.errors.transaction?.message).toBe("AlgorandMemoExceededSizeError");
    });
  });

  describe("result structure", () => {
    it("should return correct totalSpent for native transfer", async () => {
      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: validRecipient,
        amount: 1000000n,
        asset: { type: "native" },
        useAllAmount: false,
      };

      const result = await validateIntent(intent, defaultBalances, { value: 1000n });

      expect(result.totalSpent).toBe(1001000n); // amount + fees
      expect(result.amount).toBe(1000000n);
      expect(result.estimatedFees).toBe(1000n);
    });

    it("should return correct totalSpent for token transfer", async () => {
      const balancesWithToken: Balance[] = [
        ...defaultBalances,
        {
          value: 1000n,
          asset: { type: "asa", assetReference: "123" },
        },
      ];

      const intent: TransactionIntent<AlgorandMemo> = {
        sender: validSender,
        recipient: validRecipient,
        amount: 500n,
        asset: { type: "asa", assetReference: "123" },
        useAllAmount: false,
      };

      const result = await validateIntent(intent, balancesWithToken, { value: 1000n });

      expect(result.totalSpent).toBe(500n); // Only token amount, fees are in ALGO
    });
  });
});
