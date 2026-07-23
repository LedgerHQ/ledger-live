import type { Balance, TransactionIntent } from "@ledgerhq/coin-module-framework/api/types";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  NotEnoughGas,
  RecipientRequired,
} from "@ledgerhq/errors";
import { TronMemo } from "../types";
import { validateIntent } from "./validateIntent";

const mockEstimateFees = jest.fn();
jest.mock("./estimateFees", () => ({
  estimateFees: (...args: unknown[]) => mockEstimateFees(...args),
}));

const mockValidateAddress = jest.fn();
jest.mock("./validateAddress", () => ({
  validateAddress: (...args: unknown[]) => mockValidateAddress(...args),
}));

const SENDER = "TFCAe8rzCpc1iQE485VE3Ymgj6ULAuhLH7";
const RECIPIENT = "TVqLYbpUXv5Q4j7krFr3duqf2GUZghDfQy";
const TRC20_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

function makeIntent(
  overrides: Partial<TransactionIntent<TronMemo>> = {},
): TransactionIntent<TronMemo> {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    senderPublicKey: "",
    recipient: RECIPIENT,
    amount: 1_000_000n,
    asset: { type: "native", name: "Tron", unit: { name: "TRX", code: "TRX", magnitude: 6 } },
    useAllAmount: false,
    sequence: 0n,
    memo: { type: "NO_MEMO" },
    ...overrides,
  } as TransactionIntent<TronMemo>;
}

const nativeBalance = (value: bigint): Balance => ({
  value,
  asset: { type: "native" },
});

const trc20Balance = (value: bigint): Balance => ({
  value,
  asset: { type: "trc20", assetReference: TRC20_ADDRESS },
});

describe("validateIntent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEstimateFees.mockResolvedValue(270_000n);
    mockValidateAddress.mockResolvedValue(true);
  });

  it("accepts a valid native send", async () => {
    const result = await validateIntent(makeIntent(), [nativeBalance(10_000_000n)]);
    expect(result.errors).toEqual({});
    expect(result.amount).toBe(1_000_000n);
    expect(result.estimatedFees).toBe(270_000n);
    expect(result.totalSpent).toBe(1_270_000n);
  });

  it("uses customFees when provided", async () => {
    const result = await validateIntent(makeIntent(), [nativeBalance(10_000_000n)], {
      value: 500_000n,
    });
    expect(result.estimatedFees).toBe(500_000n);
    expect(mockEstimateFees).not.toHaveBeenCalled();
  });

  describe("recipient validation", () => {
    it("rejects an empty recipient", async () => {
      const result = await validateIntent(makeIntent({ recipient: "" }), [
        nativeBalance(10_000_000n),
      ]);
      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("rejects when sender equals recipient", async () => {
      const result = await validateIntent(makeIntent({ recipient: SENDER }), [
        nativeBalance(10_000_000n),
      ]);
      expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
    });

    it("rejects a malformed recipient address", async () => {
      mockValidateAddress.mockResolvedValueOnce(false);
      const result = await validateIntent(makeIntent({ recipient: "not-a-real-address" }), [
        nativeBalance(10_000_000n),
      ]);
      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
    });
  });

  describe("native amount validation", () => {
    it("rejects a zero amount when not useAllAmount", async () => {
      const result = await validateIntent(makeIntent({ amount: 0n }), [nativeBalance(10_000_000n)]);
      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("rejects when balance is insufficient for amount + fees", async () => {
      const result = await validateIntent(makeIntent({ amount: 10_000_000n }), [
        nativeBalance(10_000_000n),
      ]);
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("subtracts locked balance from available", async () => {
      const balances: Balance[] = [
        { value: 10_000_000n, locked: 9_000_000n, asset: { type: "native" } },
      ];
      const result = await validateIntent(makeIntent({ amount: 1_500_000n }), balances);
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("computes amount = available - fees when useAllAmount", async () => {
      const result = await validateIntent(makeIntent({ amount: 0n, useAllAmount: true }), [
        nativeBalance(10_000_000n),
      ]);
      expect(result.errors).toEqual({});
      expect(result.amount).toBe(9_730_000n);
      expect(result.totalSpent).toBe(10_000_000n);
    });

    it("surfaces NotEnoughBalance and NotEnoughGas when useAllAmount but fees exceed balance", async () => {
      const result = await validateIntent(makeIntent({ amount: 0n, useAllAmount: true }), [
        nativeBalance(100_000n),
      ]);
      expect(result.amount).toBe(0n);
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      expect(result.errors.gasLimit).toBeInstanceOf(NotEnoughGas);
    });
  });

  describe("token amount validation", () => {
    const tokenIntent = makeIntent({
      asset: {
        type: "trc20",
        assetReference: TRC20_ADDRESS,
        name: "USDT",
        unit: { name: "USDT", code: "USDT", magnitude: 6 },
        assetOwner: SENDER,
      },
    });

    it("accepts a valid token send", async () => {
      const result = await validateIntent(tokenIntent, [
        nativeBalance(10_000_000n),
        trc20Balance(5_000_000n),
      ]);
      expect(result.errors).toEqual({});
      expect(result.totalSpent).toBe(1_000_000n);
    });

    it("rejects when token balance is insufficient", async () => {
      const result = await validateIntent(tokenIntent, [
        nativeBalance(10_000_000n),
        trc20Balance(500n),
      ]);
      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("surfaces fee shortfall on gasLimit (NotEnoughGas), not on amount, for token sends", async () => {
      const result = await validateIntent(tokenIntent, [
        nativeBalance(100n),
        trc20Balance(5_000_000n),
      ]);
      expect(result.errors.gasLimit).toBeInstanceOf(NotEnoughGas);
      expect(result.errors.amount).toBeUndefined();
    });

    it("sets amount = full token balance when useAllAmount", async () => {
      const result = await validateIntent({ ...tokenIntent, amount: 0n, useAllAmount: true }, [
        nativeBalance(10_000_000n),
        trc20Balance(7_500_000n),
      ]);
      expect(result.amount).toBe(7_500_000n);
    });
  });
});
