import "../../live-common-setup";
import { describe, expect, it } from "bun:test";
import BigNumber from "bignumber.js";
import { getGasLimit } from "@ledgerhq/live-common/families/evm/utils";
import type { Transaction as EvmTransaction } from "@ledgerhq/live-common/families/evm/types";
import { BigNumberStrSchema } from "@shared/schema-primitives";
import {
  applyEvmGasLimitMultiplier,
  buildSolanaTransactionPatch,
  toSolanaStakeLimits,
} from "./bridge";
import type { TransactionIntent } from "../intents";

describe("applyEvmGasLimitMultiplier", () => {
  const evmIntent = (gasLimitMultiplier?: number): TransactionIntent => ({
    family: "evm",
    recipient: "0x334F5d28a71432f8fc21C7B2B6F5dBbcD8B32A7b",
    amount: "0 ETH",
    data: "0x6e553f65",
    ...(gasLimitMultiplier === undefined ? {} : { gasLimitMultiplier }),
  });

  it("raises customGasLimit to the ceil of the estimate times the multiplier", () => {
    const tx = { gasLimit: new BigNumber(1_203_887) };
    applyEvmGasLimitMultiplier(tx, evmIntent(1.3));
    // ceil(1203887 * 1.3) = ceil(1565053.1) = 1565054
    expect((tx as { customGasLimit?: BigNumber }).customGasLimit?.toFixed()).toBe("1565054");
  });

  it("leaves the estimate untouched when no multiplier is set (plain send)", () => {
    const tx: { gasLimit: BigNumber; customGasLimit?: BigNumber } = {
      gasLimit: new BigNumber(21_000),
    };
    applyEvmGasLimitMultiplier(tx, evmIntent(undefined));
    expect(tx.customGasLimit).toBeUndefined();
  });

  it("is a no-op for non-evm intents", () => {
    const tx: { gasLimit: BigNumber; customGasLimit?: BigNumber } = {
      gasLimit: new BigNumber(21_000),
    };
    applyEvmGasLimitMultiplier(tx, {
      family: "solana",
      recipient: "",
      amount: "1 SOL",
      mode: "stake.createAccount",
      validator: "voteAcc123",
    });
    expect(tx.customGasLimit).toBeUndefined();
  });

  it("does nothing when the bridge produced no usable gas estimate", () => {
    const tx: { gasLimit?: BigNumber; customGasLimit?: BigNumber } = {};
    applyEvmGasLimitMultiplier(tx, evmIntent(1.3));
    expect(tx.customGasLimit).toBeUndefined();
  });

  // The earn intent schema requires gasLimitMultiplier > 1 (gt(1)), so a value of exactly 1 is
  // unreachable in production; this just documents that the function is a pure no-op for it.
  it("behaves as a no-op when the multiplier is exactly 1", () => {
    const tx = { gasLimit: new BigNumber(1_203_887) };
    applyEvmGasLimitMultiplier(tx, evmIntent(1));
    expect((tx as { customGasLimit?: BigNumber }).customGasLimit?.toFixed()).toBe("1203887");
  });

  it("uses a pre-existing customGasLimit as the base estimate", () => {
    const tx = { gasLimit: new BigNumber(21_000), customGasLimit: new BigNumber(1_000_000) };
    applyEvmGasLimitMultiplier(tx, evmIntent(1.3));
    // ceil(1000000 * 1.3) = 1300000 — the bare gasLimit estimate is ignored.
    expect(tx.customGasLimit.toFixed()).toBe("1300000");
  });

  // Contract lock: applyEvmGasLimitMultiplier writes the buffered limit to `customGasLimit`, and the
  // fee/signing path uses coin-evm's getGasLimit(tx) = customGasLimit ?? gasLimit. If coin-evm ever
  // renames/drops that field, the multiplier would silently no-op and re-introduce out-of-gas vault
  // reverts. This asserts getGasLimit still reads customGasLimit (the field the multiplier sets).
  it("coin-evm getGasLimit reads the customGasLimit field the multiplier writes", () => {
    const tx = {
      gasLimit: new BigNumber(1_000_000),
      customGasLimit: new BigNumber(1_300_000),
    } as EvmTransaction;
    expect(getGasLimit(tx).toFixed()).toBe("1300000");
  });
});

describe("buildSolanaTransactionPatch", () => {
  it("maps send mode to a transfer carrying the memo", () => {
    expect(
      buildSolanaTransactionPatch({
        family: "solana",
        recipient: "recipientAddr",
        amount: "1 SOL",
        mode: "send",
        memo: "hello",
      }),
    ).toEqual({ mode: "send", memoType: "TEXT", memoValue: "hello" });
  });

  it("omits the memo fields when there is no memo", () => {
    expect(
      buildSolanaTransactionPatch({
        family: "solana",
        recipient: "recipientAddr",
        amount: "1 SOL",
        mode: "send",
      }),
    ).toEqual({ mode: "send" });
  });

  it("does not distinguish a token send", () => {
    expect(
      buildSolanaTransactionPatch({
        family: "solana",
        recipient: "recipientAddr",
        amount: "1 USDC",
        mode: "send",
      }),
    ).toEqual({ mode: "send" });
  });

  it("maps stake.createAccount to the validator as recipient", () => {
    const patch = buildSolanaTransactionPatch({
      family: "solana",
      recipient: "",
      amount: "1 SOL",
      mode: "stake.createAccount",
      validator: "voteAcc123",
    });

    expect(patch).toMatchObject({ mode: "stake", recipient: "voteAcc123" });
    expect(patch.familySpecificData).toMatchObject({ stakeAccountSeed: expect.any(String) });
  });

  it("maps stake.delegate to validator plus stake account", () => {
    expect(
      buildSolanaTransactionPatch({
        family: "solana",
        recipient: "",
        amount: "0 SOL",
        mode: "stake.delegate",
        validator: "voteAcc123",
        stakeAccount: "stakeAcc456",
      }),
    ).toEqual({
      mode: "delegate",
      recipient: "voteAcc123",
      memoType: "STAKE_ACCOUNT",
      memoValue: "stakeAcc456",
    });
  });

  it("maps stake.undelegate to the stake account as recipient", () => {
    expect(
      buildSolanaTransactionPatch({
        family: "solana",
        recipient: "",
        amount: "0 SOL",
        mode: "stake.undelegate",
        stakeAccount: "stakeAcc456",
      }),
    ).toEqual({ mode: "undelegate", recipient: "stakeAcc456" });
  });

  it("maps stake.withdraw to the stake account as recipient", () => {
    expect(
      buildSolanaTransactionPatch({
        family: "solana",
        recipient: "",
        amount: "0 SOL",
        mode: "stake.withdraw",
        stakeAccount: "stakeAcc456",
      }),
    ).toEqual({ mode: "unstake", recipient: "stakeAcc456" });
  });

  it("defaults missing stake/validator fields to empty strings", () => {
    expect(
      buildSolanaTransactionPatch({
        family: "solana",
        recipient: "",
        amount: "0 SOL",
        mode: "stake.delegate",
      }),
    ).toEqual({
      mode: "delegate",
      recipient: "",
      memoType: "STAKE_ACCOUNT",
      memoValue: "",
    });
  });
});

describe("toSolanaStakeLimits", () => {
  it("takes the stake account rent off the max spendable and derives the fee reserve", () => {
    expect(
      toSolanaStakeLimits({
        minimumDelegation: new BigNumber(1_000_000_000),
        rent: new BigNumber(1_666_240),
        spendableBalance: new BigNumber(50_929_500),
        pendingDebits: new BigNumber(0),
        maxSpendable: new BigNumber(50_909_500),
      }),
    ).toEqual({
      minimumDelegation: BigNumberStrSchema.parse("1000000000"),
      rent: BigNumberStrSchema.parse("1666240"),
      spendableBalance: BigNumberStrSchema.parse("50929500"),
      pendingDebits: BigNumberStrSchema.parse("0"),
      maxStakeable: BigNumberStrSchema.parse("49243260"),
      feeReserve: BigNumberStrSchema.parse("20000"),
    });
  });

  it("keeps pending outgoing SOL out of the fee reserve", () => {
    const limits = toSolanaStakeLimits({
      minimumDelegation: new BigNumber(1_000_000_000),
      rent: new BigNumber(1_666_240),
      spendableBalance: new BigNumber(600_000_000),
      pendingDebits: new BigNumber(500_000_000),
      maxSpendable: new BigNumber(99_980_000),
    });
    expect(limits.pendingDebits).toBe(BigNumberStrSchema.parse("500000000"));
    expect(limits.maxStakeable).toBe(BigNumberStrSchema.parse("98313760"));
    expect(limits.feeReserve).toBe(BigNumberStrSchema.parse("20000"));
  });

  it("floors the max stakeable and fee reserve at 0 when the max spendable does not cover the rent", () => {
    const limits = toSolanaStakeLimits({
      minimumDelegation: new BigNumber(1_000_000_000),
      rent: new BigNumber(1_666_240),
      spendableBalance: new BigNumber(1_000_000),
      pendingDebits: new BigNumber(0),
      maxSpendable: new BigNumber(980_000),
    });
    expect(limits.maxStakeable).toBe(BigNumberStrSchema.parse("0"));
    expect(limits.feeReserve).toBe(BigNumberStrSchema.parse("0"));
  });
});
