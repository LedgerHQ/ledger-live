import { describe, expect, it } from "bun:test";
import { BigNumber } from "bignumber.js";
import { getGasLimit } from "@ledgerhq/live-common/families/evm/utils";
import type { Transaction as EvmTransaction } from "@ledgerhq/live-common/families/evm/types";
import { BigNumberStrSchema } from "@shared/schema-primitives";
import { applyEvmGasLimitMultiplier, BridgeAdapter, buildSolanaTransactionPatch } from "./bridge";
import type { TransactionIntent } from "../intents";
import type { AccountDescriptor } from "../models";

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

  // The sub-account id is applied by `buildTxExtras`, not here — a token send is a plain send.
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
    // The address the confirmation screen names derives from it, so it has to be there.
    expect(patch.familySpecificData).toMatchObject({ stakeAccountSeed: expect.any(String) });
  });

  // Delegating overloads the memo to carry the stake account; the recipient is the validator.
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

describe("BridgeAdapter.getSolanaStakes", () => {
  const descriptor = { id: "sol-acc", currencyId: "solana" } as AccountDescriptor;

  // Stubs the private sync so getSolanaStakes maps a fixed synced account without hitting the chain.
  const adapterWithSyncedAccount = (account: unknown): BridgeAdapter => {
    const adapter = new BridgeAdapter();
    (adapter as unknown as { sync: () => Promise<unknown> }).sync = async () => account;
    return adapter;
  };

  it("maps stakingResources positions to EarnSolanaStake rows", async () => {
    const adapter = adapterWithSyncedAccount({
      stakingResources: {
        delegations: [
          {
            positionId: "stakeAcc1",
            validatorAddress: "voteAcc1",
            amount: new BigNumber(2_000_000),
            pendingRewards: new BigNumber(0),
            status: "bonded",
            activeAmount: new BigNumber(1_500_000),
            inactiveAmount: new BigNumber(0),
            lockedReserve: new BigNumber(500_000),
            withdrawableAmount: new BigNumber(500_000),
          },
        ],
        unbondings: [],
        redelegations: [],
        delegatedBalance: new BigNumber(2_000_000),
        pendingRewardsBalance: new BigNumber(0),
        unbondingBalance: new BigNumber(0),
      },
    });

    await expect(adapter.getSolanaStakes(descriptor)).resolves.toEqual([
      {
        stakeAccount: "stakeAcc1",
        validator: "voteAcc1",
        state: "active",
        stakeBalance: BigNumberStrSchema.parse("2000000"),
        withdrawable: BigNumberStrSchema.parse("500000"),
      },
    ]);
  });

  it("drops a position with no stake account address rather than emitting an empty target", async () => {
    const adapter = adapterWithSyncedAccount({
      stakingResources: {
        delegations: [
          {
            validatorAddress: "voteAcc1",
            amount: new BigNumber(2_000_000),
            pendingRewards: new BigNumber(0),
            status: "bonded",
            activeAmount: new BigNumber(2_000_000),
          },
          {
            positionId: "stakeAcc1",
            validatorAddress: "voteAcc1",
            amount: new BigNumber(1_000_000),
            pendingRewards: new BigNumber(0),
            status: "bonded",
            activeAmount: new BigNumber(1_000_000),
          },
        ],
        unbondings: [],
        redelegations: [],
        delegatedBalance: new BigNumber(3_000_000),
        pendingRewardsBalance: new BigNumber(0),
        unbondingBalance: new BigNumber(0),
      },
    });

    const stakes = await adapter.getSolanaStakes(descriptor);

    expect(stakes.map(s => s.stakeAccount)).toEqual(["stakeAcc1"]);
  });

  it("leaves validator undefined for a stake with no delegation", async () => {
    const adapter = adapterWithSyncedAccount({
      stakingResources: {
        delegations: [],
        unbondings: [
          {
            positionId: "stakeAcc2",
            validatorAddress: "",
            amount: new BigNumber(0),
            completionDate: new Date(0),
            status: "withdrawable",
            activeAmount: new BigNumber(0),
            inactiveAmount: new BigNumber(1_000_000),
            lockedReserve: new BigNumber(0),
            withdrawableAmount: new BigNumber(1_000_000),
          },
        ],
        redelegations: [],
        delegatedBalance: new BigNumber(0),
        pendingRewardsBalance: new BigNumber(0),
        unbondingBalance: new BigNumber(0),
      },
    });

    const [stake] = await adapter.getSolanaStakes(descriptor);
    expect(stake.validator).toBeUndefined();
    expect(stake).toEqual({
      stakeAccount: "stakeAcc2",
      validator: undefined,
      state: "inactive",
      stakeBalance: BigNumberStrSchema.parse("1000000"),
      withdrawable: BigNumberStrSchema.parse("1000000"),
    });
  });

  it("keeps lamport amounts as decimal strings past Number.MAX_SAFE_INTEGER", async () => {
    const unsafeLamports = "9007199254740993";
    const adapter = adapterWithSyncedAccount({
      stakingResources: {
        delegations: [
          {
            positionId: "stakeAcc3",
            validatorAddress: "voteAcc3",
            amount: new BigNumber(unsafeLamports),
            pendingRewards: new BigNumber(0),
            status: "bonded",
            activeAmount: new BigNumber(unsafeLamports),
            inactiveAmount: new BigNumber(0),
            lockedReserve: new BigNumber(0),
            withdrawableAmount: new BigNumber(unsafeLamports),
          },
        ],
        unbondings: [],
        redelegations: [],
        delegatedBalance: new BigNumber(unsafeLamports),
        pendingRewardsBalance: new BigNumber(0),
        unbondingBalance: new BigNumber(0),
      },
    });

    await expect(adapter.getSolanaStakes(descriptor)).resolves.toEqual([
      {
        stakeAccount: "stakeAcc3",
        validator: "voteAcc3",
        state: "active",
        stakeBalance: BigNumberStrSchema.parse(unsafeLamports),
        withdrawable: BigNumberStrSchema.parse(unsafeLamports),
      },
    ]);
  });

  it("returns [] when the account has no stakingResources", async () => {
    const adapter = adapterWithSyncedAccount({});
    await expect(adapter.getSolanaStakes(descriptor)).resolves.toEqual([]);
  });
});
