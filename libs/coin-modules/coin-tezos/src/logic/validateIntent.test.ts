import { validateIntent } from "./validateIntent";
import * as estimateFeesModule from "./estimateFees";
import tzktApi from "../network/tzkt";
import coinConfig from "../config";
import {
  RecipientRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  AmountRequired,
  NotEnoughBalance,
} from "@ledgerhq/errors";

describe("validateIntent", () => {
  const senderAddress = "tz1TzrmTBSuiVHV2VfMnGRMYvTEPCP42oSM8";
  const validRecipient = "tz1KqTpEZ7Yob7QbPE4Hy4Wo8fHG8LhKxZSx";

  const mockEstimateFees = jest.spyOn(estimateFeesModule, "estimateFees");
  const mockGetAccountByAddress = jest.spyOn(tzktApi, "getAccountByAddress");

  beforeEach(() => {
    jest.clearAllMocks();

    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      baker: { url: "http://baker.example.com" },
      explorer: { url: "http://tezos.explorer.com", maxTxQuery: 100 },
      node: { url: "http://tezos.node.com" },
      fees: {
        minGasLimit: 600,
        minRevealGasLimit: 300,
        minStorageLimit: 0,
        minFees: 500,
        minEstimatedFees: 500,
      },
    }));

    mockEstimateFees.mockResolvedValue({
      fees: BigInt(1000),
      gasLimit: BigInt(10000),
      storageLimit: BigInt(0),
      estimatedFees: BigInt(1000),
    });

    mockGetAccountByAddress.mockResolvedValue({
      type: "user",
      address: senderAddress,
      publicKey: "edpk...",
      balance: 5000000,
      revealed: true,
      counter: 0,
      delegationLevel: 0,
      delegationTime: "2021-01-01T00:00:00Z",
      numTransactions: 0,
      firstActivityTime: "2021-01-01T00:00:00Z",
    });
  });

  describe("recipient validation", () => {
    it("should return RecipientRequired error when recipient is missing", async () => {
      const result = await validateIntent({
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: "",
        amount: BigInt(1000),
      });

      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("should return InvalidAddress error for invalid recipient", async () => {
      const result = await validateIntent({
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: "invalid_address",
        amount: BigInt(1000),
      });

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
    });

    it("should return InvalidAddressBecauseDestinationIsAlsoSource when sender equals recipient", async () => {
      const result = await validateIntent({
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: senderAddress,
        amount: BigInt(1000),
      });

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });
  });

  describe("amount validation", () => {
    it("should return AmountRequired error when amount is zero and not useAllAmount", async () => {
      const result = await validateIntent({
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: BigInt(0),
        useAllAmount: false,
      });

      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("should not return AmountRequired error when useAllAmount is true", async () => {
      const result = await validateIntent({
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: BigInt(0),
        useAllAmount: true,
      });

      expect(result.errors.amount).toBeUndefined();
    });
  });

  describe("balance validation", () => {
    it("should return NotEnoughBalance error when amount exceeds balance", async () => {
      const balance = 1000000; // 1 XTZ
      const amount = 2000000; // 2 XTZ

      mockGetAccountByAddress.mockResolvedValue({
        type: "user",
        address: senderAddress,
        publicKey: "edpk...",
        balance,
        revealed: true,
        counter: 0,
        delegationLevel: 0,
        delegationTime: "2021-01-01T00:00:00Z",
        numTransactions: 0,
        firstActivityTime: "2021-01-01T00:00:00Z",
      });

      const result = await validateIntent({
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: BigInt(amount),
      });

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("should pass validation when amount is within balance", async () => {
      const balance = 5000000; // 5 XTZ
      const amount = 1000000; // 1 XTZ

      mockGetAccountByAddress.mockResolvedValue({
        type: "user",
        address: senderAddress,
        publicKey: "edpk...",
        balance,
        revealed: true,
        counter: 0,
        delegationLevel: 0,
        delegationTime: "2021-01-01T00:00:00Z",
        numTransactions: 0,
        firstActivityTime: "2021-01-01T00:00:00Z",
      });

      const result = await validateIntent({
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount: BigInt(amount),
      });

      expect(result.errors.amount).toBeUndefined();
      expect(result.amount).toBe(BigInt(amount));
    });
  });

  describe("transaction types", () => {
    it("should pass validation for delegate transaction", async () => {
      const result = await validateIntent({
        asset: { type: "native" },
        type: "delegate",
        sender: senderAddress,
        recipient: validRecipient,
        amount: BigInt(0),
      });

      expect(result.errors).toEqual({});
    });

    it("should pass validation for undelegate transaction", async () => {
      const result = await validateIntent({
        asset: { type: "native" },
        type: "undelegate",
        sender: senderAddress,
        recipient: "",
        amount: BigInt(0),
      });

      expect(result.errors).toEqual({});
    });

    it("should handle stake intent (mapped to delegate)", async () => {
      const result = await validateIntent({
        asset: { type: "native" },
        type: "stake",
        sender: senderAddress,
        recipient: validRecipient,
        amount: BigInt(0),
      });

      expect(result.errors).toEqual({});
    });

    it("should handle unstake intent (mapped to undelegate)", async () => {
      const result = await validateIntent({
        asset: { type: "native" },
        type: "unstake",
        sender: senderAddress,
        recipient: "",
        amount: BigInt(0),
      });

      expect(result.errors).toEqual({});
    });
  });

  describe("successful validation", () => {
    it("should return valid result with correct values", async () => {
      const amount = BigInt(1000000);
      const estimatedFees = BigInt(1500);

      mockEstimateFees.mockResolvedValue({
        fees: BigInt(1000),
        gasLimit: BigInt(10000),
        storageLimit: BigInt(0),
        estimatedFees,
      });

      const result = await validateIntent({
        asset: { type: "native" },
        type: "send",
        sender: senderAddress,
        recipient: validRecipient,
        amount,
      });

      expect(result).toMatchObject({
        errors: {},
        warnings: {},
        estimatedFees,
        amount,
        totalSpent: amount + estimatedFees,
      });
    });
  });
});
