import {
  AmountRequired,
  FeeRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  RecipientRequired,
} from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { MAX_MEMO_LENGTH } from "@ledgerhq/hw-app-concordium/lib/cbor";
import coinConfig from "../config";
import {
  createFixtureAccount,
  createFixtureTransaction,
  VALID_ADDRESS,
  VALID_ADDRESS_2,
} from "../test/fixtures";
import { ConcordiumInsufficientFunds, ConcordiumMemoTooLong } from "../types/errors";
import { getTransactionStatus } from "./getTransactionStatus";

describe("getTransactionStatus", () => {
  beforeEach(() => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      networkType: "testnet",
      grpcUrl: "https://grpc.testnet.concordium.com",
      grpcPort: 20000,
      proxyUrl: "https://wallet-proxy.testnet.concordium.com",
      minReserve: 0,
      currency: createFixtureAccount().currency,
    }));
  });

  describe("fee validation", () => {
    it("should return FeeRequired error when fee is undefined (becomes zero)", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ fee: undefined });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.fee).toBeInstanceOf(FeeRequired);
    });

    it("should return FeeRequired error when fee is zero", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ fee: new BigNumber(0) });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.fee).toBeInstanceOf(FeeRequired);
    });

    it("should return FeeTooHigh warning when fee exceeds 10x the amount", async () => {
      // GIVEN - fee (1100) * 10 = 11000 > amount (100)
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({
        amount: new BigNumber(100),
        fee: new BigNumber(1100),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
    });

    it("should not warn about fee when fee is exactly 1/10th of the amount", async () => {
      // GIVEN - fee (100) * 10 = 1000 = amount (1000), so NOT greater
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({
        amount: new BigNumber(1000),
        fee: new BigNumber(100),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.warnings.feeTooHigh).toBeUndefined();
    });

    it("should not warn about fee when amount is zero", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({
        amount: new BigNumber(0),
        fee: new BigNumber(1000),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.warnings.feeTooHigh).toBeUndefined();
    });
  });

  describe("balance validation", () => {
    it("should return ConcordiumInsufficientFunds when totalSpent exceeds balance", async () => {
      // GIVEN - totalSpent (600000) > balance (500000) - reserve (0)
      const account = createFixtureAccount({ balance: new BigNumber(500000) });
      const transaction = createFixtureTransaction({
        amount: new BigNumber(500000),
        fee: new BigNumber(100000),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.amount).toBeInstanceOf(ConcordiumInsufficientFunds);
    });

    it("should return ConcordiumInsufficientFunds when totalSpent exceeds balance minus reserve but not balance", async () => {
      // GIVEN - balance (500000) >= totalSpent (500000) > balance (500000) - reserve (100000) = 400000
      coinConfig.setCoinConfig(() => ({
        status: { type: "active" },
        networkType: "testnet",
        grpcUrl: "https://grpc.testnet.concordium.com",
        grpcPort: 20000,
        proxyUrl: "https://wallet-proxy.testnet.concordium.com",
        minReserve: 100000,
        currency: createFixtureAccount().currency,
      }));
      const account = createFixtureAccount({ balance: new BigNumber(500000) });
      const transaction = createFixtureTransaction({
        amount: new BigNumber(400000),
        fee: new BigNumber(100000),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.amount).toBeInstanceOf(ConcordiumInsufficientFunds);
    });

    it("should not error when amount is below reserve but totalSpent is within limits", async () => {
      // GIVEN - amount (50000) < reserve (100000), but totalSpent (51000) < balance (1000000) - reserve (100000)
      coinConfig.setCoinConfig(() => ({
        status: { type: "active" },
        networkType: "testnet",
        grpcUrl: "https://grpc.testnet.concordium.com",
        grpcPort: 20000,
        proxyUrl: "https://wallet-proxy.testnet.concordium.com",
        minReserve: 100000,
        currency: createFixtureAccount().currency,
      }));
      const account = createFixtureAccount({ balance: new BigNumber(1000000) });
      const transaction = createFixtureTransaction({
        amount: new BigNumber(50000),
        fee: new BigNumber(1000),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.amount).toBeUndefined();
    });

    it("should not error when amount equals reserve", async () => {
      // GIVEN
      coinConfig.setCoinConfig(() => ({
        status: { type: "active" },
        networkType: "testnet",
        grpcUrl: "https://grpc.testnet.concordium.com",
        grpcPort: 20000,
        proxyUrl: "https://wallet-proxy.testnet.concordium.com",
        minReserve: 100000,
        currency: createFixtureAccount().currency,
      }));
      const account = createFixtureAccount({ balance: new BigNumber(1000000) });
      const transaction = createFixtureTransaction({
        amount: new BigNumber(100000),
        fee: new BigNumber(1000),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.amount).toBeUndefined();
    });
  });

  describe("recipient validation", () => {
    it("should return RecipientRequired error when recipient is empty", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ recipient: "" });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("should return InvalidAddressBecauseDestinationIsAlsoSource when recipient equals sender", async () => {
      // GIVEN
      const account = createFixtureAccount({ freshAddress: VALID_ADDRESS });
      const transaction = createFixtureTransaction({ recipient: VALID_ADDRESS });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });

    it("should return InvalidAddress error for invalid address format", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ recipient: "not-a-valid-address" });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
    });

    it("should accept valid recipient address", async () => {
      // GIVEN
      const account = createFixtureAccount({ freshAddress: VALID_ADDRESS });
      const transaction = createFixtureTransaction({ recipient: VALID_ADDRESS_2 });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.recipient).toBeUndefined();
    });
  });

  describe("amount validation", () => {
    it("should return AmountRequired error when amount is zero", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({
        amount: new BigNumber(0),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("should not return AmountRequired when useAllAmount is true even with zero calculated amount", async () => {
      // GIVEN
      const account = createFixtureAccount({ spendableBalance: new BigNumber(1000) });
      const transaction = createFixtureTransaction({
        amount: new BigNumber(0),
        fee: new BigNumber(1000),
        useAllAmount: true,
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.amount).not.toBeInstanceOf(AmountRequired);
    });
  });

  describe("useAllAmount calculation", () => {
    it("should calculate amount as spendableBalance minus fee when useAllAmount is true", async () => {
      // GIVEN
      const account = createFixtureAccount({ spendableBalance: new BigNumber(100000) });
      const transaction = createFixtureTransaction({
        amount: new BigNumber(0),
        fee: new BigNumber(1000),
        useAllAmount: true,
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.amount).toEqual(new BigNumber(99000));
      expect(result.totalSpent).toEqual(new BigNumber(100000));
    });

    it("should use transaction amount when useAllAmount is false", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({
        amount: new BigNumber(50000),
        fee: new BigNumber(1000),
        useAllAmount: false,
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.amount).toEqual(new BigNumber(50000));
      expect(result.totalSpent).toEqual(new BigNumber(51000));
    });

    it("should return zero amount when fee exceeds spendableBalance with useAllAmount", async () => {
      // GIVEN
      const account = createFixtureAccount({ spendableBalance: new BigNumber(500) });
      const transaction = createFixtureTransaction({
        fee: new BigNumber(1000),
        useAllAmount: true,
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.amount).toEqual(new BigNumber(0));
    });
  });

  describe("return values", () => {
    it("should return correct estimatedFees", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({
        fee: new BigNumber(5000),
        recipient: VALID_ADDRESS_2,
      });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.estimatedFees).toEqual(new BigNumber(5000));
    });

    it("should return zero estimatedFees when fee is undefined", async () => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ fee: undefined });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.estimatedFees).toEqual(new BigNumber(0));
    });
  });

  describe("memo validation", () => {
    it.each([
      ["undefined", undefined],
      ["empty string", ""],
      ["simple text", "Payment for invoice"],
      ["unicode characters", "Hello 世界 🌍"],
    ])("should accept %s memo", async (_description, memo) => {
      // GIVEN
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ memo, recipient: VALID_ADDRESS_2 });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.memo).toBeUndefined();
    });

    it.each([
      ["ASCII at limit", "a".repeat(MAX_MEMO_LENGTH), 254],
      ["multi-byte at limit", "🌍".repeat(63) + "12", 254],
    ])("should accept %s (%d bytes)", async (_description, memo, expectedBytes) => {
      // GIVEN
      expect(Buffer.from(memo, "utf-8").length).toBe(expectedBytes);
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ memo, recipient: VALID_ADDRESS_2 });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.memo).toBeUndefined();
    });

    it.each([
      ["ASCII over limit", "a".repeat(MAX_MEMO_LENGTH + 1), 255],
      ["multi-byte over limit", "🌍".repeat(64), 256],
    ])("should reject %s (%d bytes)", async (_description, memo, expectedBytes) => {
      // GIVEN
      expect(Buffer.from(memo, "utf-8").length).toBe(expectedBytes);
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ memo, recipient: VALID_ADDRESS_2 });

      // WHEN
      const result = await getTransactionStatus(account, transaction);

      // THEN
      expect(result.errors.memo).toBeInstanceOf(ConcordiumMemoTooLong);
    });
  });
});
