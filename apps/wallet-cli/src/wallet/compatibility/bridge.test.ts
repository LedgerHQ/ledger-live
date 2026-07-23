import { describe, expect, it } from "bun:test";
import { BigNumber } from "bignumber.js";
import { getGasLimit } from "@ledgerhq/coin-evm/utils";
import type { Transaction as EvmTransaction } from "@ledgerhq/coin-evm/types/index";
import { applyEvmGasLimitMultiplier, BridgeAdapter, buildSolanaTransactionModel } from "./bridge";
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

describe("buildSolanaTransactionModel", () => {
  it("maps send mode to a transfer model carrying the memo", () => {
    const model = buildSolanaTransactionModel({
      family: "solana",
      recipient: "recipientAddr",
      amount: "1 SOL",
      mode: "send",
      memo: "hello",
    });
    expect(model).toEqual({ kind: "transfer", uiState: { memo: "hello" } });
  });

  it("maps send mode with a token account to a token.transfer model", () => {
    const model = buildSolanaTransactionModel(
      {
        family: "solana",
        recipient: "recipientAddr",
        amount: "1 USDC",
        mode: "send",
        memo: "hello",
      },
      { id: "subAcc789" } as Parameters<typeof buildSolanaTransactionModel>[1],
    );
    expect(model).toEqual({
      kind: "token.transfer",
      uiState: { subAccountId: "subAcc789", memo: "hello" },
    });
  });

  it("routes a send with a token account but no memo to token.transfer (memo undefined)", () => {
    const model = buildSolanaTransactionModel(
      {
        family: "solana",
        recipient: "recipientAddr",
        amount: "1 USDC",
        mode: "send",
      },
      { id: "sub" } as Parameters<typeof buildSolanaTransactionModel>[1],
    );
    expect(model).toEqual({
      kind: "token.transfer",
      uiState: { subAccountId: "sub", memo: undefined },
    });
  });

  it("routes a send with no token account and no memo to a native transfer (memo undefined)", () => {
    const model = buildSolanaTransactionModel({
      family: "solana",
      recipient: "recipientAddr",
      amount: "1 SOL",
      mode: "send",
    });
    expect(model).toEqual({ kind: "transfer", uiState: { memo: undefined } });
  });

  it("maps stake.createAccount to a stake.createAccount model with the validator", () => {
    const model = buildSolanaTransactionModel({
      family: "solana",
      recipient: "",
      amount: "1 SOL",
      mode: "stake.createAccount",
      validator: "voteAcc123",
    });
    expect(model).toEqual({
      kind: "stake.createAccount",
      uiState: { delegate: { voteAccAddress: "voteAcc123" } },
    });
  });

  it("maps stake.delegate to a stake.delegate model with stake account and validator", () => {
    const model = buildSolanaTransactionModel({
      family: "solana",
      recipient: "",
      amount: "0 SOL",
      mode: "stake.delegate",
      validator: "voteAcc123",
      stakeAccount: "stakeAcc456",
    });
    expect(model).toEqual({
      kind: "stake.delegate",
      uiState: { stakeAccAddr: "stakeAcc456", voteAccAddr: "voteAcc123" },
    });
  });

  it("maps stake.undelegate to a stake.undelegate model with the stake account", () => {
    const model = buildSolanaTransactionModel({
      family: "solana",
      recipient: "",
      amount: "0 SOL",
      mode: "stake.undelegate",
      stakeAccount: "stakeAcc456",
    });
    expect(model).toEqual({
      kind: "stake.undelegate",
      uiState: { stakeAccAddr: "stakeAcc456" },
    });
  });

  it("maps stake.withdraw to a stake.withdraw model with the stake account", () => {
    const model = buildSolanaTransactionModel({
      family: "solana",
      recipient: "",
      amount: "0 SOL",
      mode: "stake.withdraw",
      stakeAccount: "stakeAcc456",
    });
    expect(model).toEqual({
      kind: "stake.withdraw",
      uiState: { stakeAccAddr: "stakeAcc456" },
    });
  });

  it("defaults missing stake/validator fields to empty strings", () => {
    expect(
      buildSolanaTransactionModel({
        family: "solana",
        recipient: "",
        amount: "0 SOL",
        mode: "stake.delegate",
      }),
    ).toEqual({
      kind: "stake.delegate",
      uiState: { stakeAccAddr: "", voteAccAddr: "" },
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

  it("maps solanaResources.stakes to EarnSolanaStake rows", async () => {
    const adapter = adapterWithSyncedAccount({
      solanaResources: {
        stakes: [
          {
            stakeAccAddr: "stakeAcc1",
            delegation: { voteAccAddr: "voteAcc1" },
            activation: { state: "active" },
            stakeAccBalance: 2_000_000,
            withdrawable: 500_000,
          },
        ],
      },
    });

    await expect(adapter.getSolanaStakes(descriptor)).resolves.toEqual([
      {
        stakeAccount: "stakeAcc1",
        validator: "voteAcc1",
        state: "active",
        stakeBalance: 2_000_000,
        withdrawable: 500_000,
      },
    ]);
  });

  it("leaves validator undefined for a stake with no delegation", async () => {
    const adapter = adapterWithSyncedAccount({
      solanaResources: {
        stakes: [
          {
            stakeAccAddr: "stakeAcc2",
            activation: { state: "inactive" },
            stakeAccBalance: 1_000_000,
            withdrawable: 1_000_000,
          },
        ],
      },
    });

    const [stake] = await adapter.getSolanaStakes(descriptor);
    expect(stake.validator).toBeUndefined();
    expect(stake).toEqual({
      stakeAccount: "stakeAcc2",
      validator: undefined,
      state: "inactive",
      stakeBalance: 1_000_000,
      withdrawable: 1_000_000,
    });
  });

  it("returns [] when the account has no solanaResources", async () => {
    const adapter = adapterWithSyncedAccount({});
    await expect(adapter.getSolanaStakes(descriptor)).resolves.toEqual([]);
  });
});
