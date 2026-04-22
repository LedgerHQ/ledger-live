import { describe, expect, it } from "bun:test";
import {
  AmountWithTickerSchema,
  TransactionIntentSchema,
  BitcoinTransactionIntentSchema,
  EvmTransactionIntentSchema,
  SolanaTransactionIntentSchema,
} from "./index";

describe("AmountWithTickerSchema", () => {
  it.each([
    "0.001 BTC",
    "1 ETH",
    "0.5ETH",
    "ETH0.5",
    "ETH 0.5",
    "100 USDT",
  ])("accepts valid amount string: %s", input => {
    expect(AmountWithTickerSchema.safeParse(input).success).toBe(true);
  });

  it.each([
    "",
    "0.5",
    "ETH",
    "1.2.3 ETH",
    "0.5 ETH extra",
  ])("rejects invalid amount string: %s", input => {
    expect(AmountWithTickerSchema.safeParse(input).success).toBe(false);
  });
});

describe("BitcoinTransactionIntentSchema", () => {
  it("parses a minimal valid intent", () => {
    const result = BitcoinTransactionIntentSchema.safeParse({
      family: "bitcoin",
      recipient: "bc1qexample",
      amount: "0.001 BTC",
    });
    expect(result.success).toBe(true);
  });

  it("parses with optional feePerByte and rbf", () => {
    const result = BitcoinTransactionIntentSchema.safeParse({
      family: "bitcoin",
      recipient: "bc1qexample",
      amount: "0.001 BTC",
      feePerByte: "10",
      rbf: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.feePerByte).toBe("10");
      expect(result.data.rbf).toBe(true);
    }
  });

  it("rejects wrong family", () => {
    expect(BitcoinTransactionIntentSchema.safeParse({ family: "evm", recipient: "0x1", amount: "1 ETH" }).success).toBe(false);
  });

  it("rejects amount without ticker", () => {
    expect(BitcoinTransactionIntentSchema.safeParse({ family: "bitcoin", recipient: "bc1q", amount: "0.001" }).success).toBe(false);
  });
});

describe("EvmTransactionIntentSchema", () => {
  it("parses a valid intent", () => {
    const result = EvmTransactionIntentSchema.safeParse({
      family: "evm",
      recipient: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
      amount: "0.5 ETH",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing recipient", () => {
    expect(EvmTransactionIntentSchema.safeParse({ family: "evm", amount: "0.5 ETH" }).success).toBe(false);
  });
});

describe("SolanaTransactionIntentSchema", () => {
  it("parses a minimal valid intent with default mode", () => {
    const result = SolanaTransactionIntentSchema.safeParse({
      family: "solana",
      recipient: "7xCU4XQfL8589X6vVt8q5F7J3Z9T1z6W6X6X6X6X6X",
      amount: "1 SOL",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.mode).toBe("send");
  });

  it("parses stake.delegate mode with validator", () => {
    const result = SolanaTransactionIntentSchema.safeParse({
      family: "solana",
      recipient: "7xCU4XQfL8589X6vVt8q5F7J3Z9T1z6W6X6X6X6X6X",
      amount: "1 SOL",
      mode: "stake.delegate",
      validator: "validatorPubkey",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe("stake.delegate");
      expect(result.data.validator).toBe("validatorPubkey");
    }
  });

  it("rejects unknown mode", () => {
    expect(SolanaTransactionIntentSchema.safeParse({
      family: "solana",
      recipient: "addr",
      amount: "1 SOL",
      mode: "unknown_mode",
    }).success).toBe(false);
  });
});

describe("TransactionIntentSchema", () => {
  it("rejects unknown family", () => {
    expect(TransactionIntentSchema.safeParse({
      family: "cardano",
      recipient: "addr1",
      amount: "1 ADA",
    }).success).toBe(false);
  });
});
