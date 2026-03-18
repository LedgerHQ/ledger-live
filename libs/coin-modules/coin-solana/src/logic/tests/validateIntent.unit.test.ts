import type {
  Balance,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
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

  describe("staking intents", () => {
    describe("stake.createAccount", () => {
      function makeStakeIntent(
        overrides?: Partial<StakingTransactionIntent>,
      ): StakingTransactionIntent {
        return {
          intentType: "staking",
          type: "stake.createAccount",
          mode: "delegate",
          sender: SENDER,
          recipient: RECIPIENT,
          valAddress: RECIPIENT,
          amount: 1_000_000_000n,
          asset: { type: "native", name: "Solana" },
          ...overrides,
        };
      }

      it("should validate a correct stake.createAccount intent", async () => {
        const result = await validateIntent(makeStakeIntent(), makeBalances(), { value: 5000n });

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(1_000_000_000n);
        expect(result.totalSpent).toBe(1_000_000_000n + 5000n);
      });

      it("should error when recipient is missing", async () => {
        const result = await validateIntent(makeStakeIntent({ recipient: "" }), makeBalances(), {
          value: 5000n,
        });

        expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
      });

      it("should error when recipient is an invalid address", async () => {
        const result = await validateIntent(
          makeStakeIntent({ recipient: "not-valid!!!" }),
          makeBalances(),
          { value: 5000n },
        );

        expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
      });

      it("should error when amount is zero", async () => {
        const result = await validateIntent(makeStakeIntent({ amount: 0n }), makeBalances(), {
          value: 5000n,
        });

        expect(result.errors.amount).toBeInstanceOf(AmountRequired);
      });

      it("should error when amount + fees exceed available balance", async () => {
        const result = await validateIntent(
          makeStakeIntent({ amount: 5_000_000_000n }),
          makeBalances(5_000_000_000n, 890_880n),
          { value: 5000n },
        );

        expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      });

      it("should compute max amount for useAllAmount", async () => {
        const result = await validateIntent(
          makeStakeIntent({ amount: 0n, useAllAmount: true }),
          makeBalances(2_000_000_000n, 890_880n),
          { value: 5000n },
        );

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(2_000_000_000n - 890_880n - 5000n);
      });

      it("should clamp amount to 0 when useAllAmount and balance is insufficient", async () => {
        const result = await validateIntent(
          makeStakeIntent({ amount: 0n, useAllAmount: true }),
          makeBalances(1000n, 0n),
          { value: 5000n },
        );

        expect(result.amount).toBe(0n);
      });
    });

    describe("stake.delegate", () => {
      function makeDelegateIntent(
        overrides?: Partial<StakingTransactionIntent>,
      ): StakingTransactionIntent {
        return {
          intentType: "staking",
          type: "stake.delegate",
          mode: "delegate",
          sender: SENDER,
          recipient: RECIPIENT,
          valAddress: RECIPIENT,
          amount: 0n,
          asset: { type: "native", name: "Solana" },
          ...overrides,
        };
      }

      it("should set amount to 0 and totalSpent to fees", async () => {
        const result = await validateIntent(makeDelegateIntent(), makeBalances(), { value: 5000n });

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(0n);
        expect(result.totalSpent).toBe(5000n);
      });

      it("should error when fees exceed available balance (value - locked)", async () => {
        const result = await validateIntent(makeDelegateIntent(), makeBalances(10_000n, 8_000n), {
          value: 5000n,
        });

        expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      });
    });

    describe("stake.undelegate", () => {
      function makeUndelegateIntent(
        overrides?: Partial<StakingTransactionIntent>,
      ): StakingTransactionIntent {
        return {
          intentType: "staking",
          type: "stake.undelegate",
          mode: "undelegate",
          sender: SENDER,
          recipient: RECIPIENT,
          valAddress: "",
          amount: 0n,
          asset: { type: "native", name: "Solana" },
          ...overrides,
        };
      }

      it("should set amount to 0 and totalSpent to fees", async () => {
        const result = await validateIntent(makeUndelegateIntent(), makeBalances(), {
          value: 5000n,
        });

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(0n);
        expect(result.totalSpent).toBe(5000n);
      });

      it("should error when fees exceed total native value (not available)", async () => {
        const result = await validateIntent(makeUndelegateIntent(), makeBalances(3000n, 0n), {
          value: 5000n,
        });

        expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      });
    });

    describe("stake.withdraw", () => {
      function makeWithdrawIntent(overrides?: Partial<TransactionIntent>): TransactionIntent {
        return {
          intentType: "transaction",
          type: "stake.withdraw",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: 2_000_000_000n,
          asset: { type: "native", name: "Solana" },
          ...overrides,
        };
      }

      it("should use the provided amount", async () => {
        const result = await validateIntent(makeWithdrawIntent(), makeBalances(), { value: 5000n });

        expect(result.errors).toEqual({});
        expect(result.amount).toBe(2_000_000_000n);
        expect(result.totalSpent).toBe(5000n);
      });

      it("should clamp to 0 when amount is 0", async () => {
        const result = await validateIntent(
          makeWithdrawIntent({ useAllAmount: true, amount: 0n }),
          makeBalances(),
          { value: 5000n },
        );

        expect(result.amount).toBe(0n);
      });

      it("should clamp negative amount to 0", async () => {
        const result = await validateIntent(
          makeWithdrawIntent({ amount: -1_000n }),
          makeBalances(),
          { value: 5000n },
        );

        expect(result.amount).toBe(0n);
      });

      it("should error when fees exceed total native value", async () => {
        const result = await validateIntent(makeWithdrawIntent(), makeBalances(3000n, 0n), {
          value: 5000n,
        });

        expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
      });
    });
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

    it("should default to 0 when useAllAmount and token not found in balances", async () => {
      const result = await validateIntent(
        makeTokenIntent({ amount: 0n, useAllAmount: true }),
        makeBalances(),
        { value: 5000n },
      );

      expect(result.amount).toBe(0n);
    });
  });
});
