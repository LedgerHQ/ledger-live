import type { Balance, TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import {
  AmountRequired,
  FeeTooHigh,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { validateIntent } from "../validateIntent";

const SENDER = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";
const RECIPIENT = "7VHUFJHWu2CuExkJcJrzhQPJ2oygupTWkL2A2For4BmE";

function makeIntent(overrides?: Partial<TransactionIntent>): TransactionIntent {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 1_000_000_000n,
    asset: { type: "native", name: "Solana" },
    ...overrides,
  };
}

function makeBalances(native = 5_000_000_000n, locked = 890_880n): Balance[] {
  return [{ value: native, asset: { type: "native" }, locked }];
}

describe("validateIntent", () => {
  afterEach(() => jest.clearAllMocks());

  it("should return valid result for a basic native transfer", async () => {
    const result = await validateIntent(makeIntent(), makeBalances(), { value: 5000n });

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.amount).toBe(1_000_000_000n);
    expect(result.estimatedFees).toBe(5000n);
    expect(result.totalSpent).toBe(1_000_000_000n + 5000n);
  });

  it("should error when recipient is missing", async () => {
    const result = await validateIntent(makeIntent({ recipient: "" }), makeBalances(), {
      value: 5000n,
    });

    expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("should error when recipient is the sender", async () => {
    const result = await validateIntent(makeIntent({ recipient: SENDER }), makeBalances(), {
      value: 5000n,
    });

    expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  it("should error when recipient is an invalid address", async () => {
    const result = await validateIntent(
      makeIntent({ recipient: "not-a-valid-address!!!" }),
      makeBalances(),
      { value: 5000n },
    );

    expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("should error when amount is zero and not useAllAmount", async () => {
    const result = await validateIntent(makeIntent({ amount: 0n }), makeBalances(), {
      value: 5000n,
    });

    expect(result.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("should error when amount exceeds spendable balance (native)", async () => {
    const result = await validateIntent(
      makeIntent({ amount: 10_000_000_000n }),
      makeBalances(5_000_000_000n, 890_880n),
      { value: 5000n },
    );

    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should warn when fee is too high relative to amount", async () => {
    const result = await validateIntent(makeIntent({ amount: 100n }), makeBalances(), {
      value: 5000n,
    });

    expect(result.warnings.feeTooHigh).toBeInstanceOf(FeeTooHigh);
  });

  it("should compute amount for useAllAmount (native)", async () => {
    const result = await validateIntent(
      makeIntent({ amount: 0n, useAllAmount: true }),
      makeBalances(2_000_000_000n, 890_880n),
      { value: 5000n },
    );

    expect(result.errors).toEqual({});
    const expectedAmount = 2_000_000_000n - 890_880n - 5000n;
    expect(result.amount).toBe(expectedAmount);
    expect(result.totalSpent).toBe(expectedAmount + 5000n);
  });

  it("should return zero amount when useAllAmount and balance insufficient for fees", async () => {
    const result = await validateIntent(
      makeIntent({ amount: 0n, useAllAmount: true }),
      makeBalances(5000n, 0n),
      { value: 10_000n },
    );

    expect(result.amount).toBe(0n);
  });

  it("should default estimatedFees to 0n when no customFees provided", async () => {
    const result = await validateIntent(makeIntent(), makeBalances());

    expect(result.estimatedFees).toBe(0n);
    expect(result.totalSpent).toBe(1_000_000_000n);
  });

  describe("token transfers", () => {
    const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    function makeTokenIntent(overrides?: Partial<TransactionIntent>): TransactionIntent {
      return makeIntent({
        asset: { type: "spl-token", assetReference: USDC_MINT, name: "USDC" },
        ...overrides,
      });
    }

    function makeTokenBalances(): Balance[] {
      return [
        { value: 5_000_000_000n, asset: { type: "native" }, locked: 890_880n },
        { value: 10_000_000n, asset: { type: "spl-token", assetReference: USDC_MINT } },
      ];
    }

    it("should validate a basic token transfer", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 1_000_000n }),
        makeTokenBalances(),
        { value: 5000n },
      );

      expect(result.errors).toEqual({});
      expect(result.amount).toBe(1_000_000n);
      expect(result.totalSpent).toBe(1_000_000n);
    });

    it("should error when token amount exceeds balance", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 50_000_000n }),
        makeTokenBalances(),
        { value: 5000n },
      );

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("should compute amount for useAllAmount (token)", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 0n, useAllAmount: true }),
        makeTokenBalances(),
        { value: 5000n },
      );

      expect(result.amount).toBe(10_000_000n);
      expect(result.totalSpent).toBe(10_000_000n);
    });
  });
});
