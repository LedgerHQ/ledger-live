import { describe, expect, it } from "bun:test";
import type { WalletAdapter } from "../index";
import type { AccountDescriptor } from "../models";
import type { TransactionIntent } from "../intents";
import type { CommandOutput } from "../../output";
import { depositSolana, withdrawSolana } from "./sol-stake";

const DESCRIPTOR: AccountDescriptor = {
  id: "solana:1:solana:addr123:solanaMain:0",
  currencyId: "solana",
  freshAddress: "addr123",
  seedIdentifier: "addr123",
  derivationMode: "solanaMain",
  index: 0,
};

// Minimal CommandOutput: only the methods the dry-run path touches need to behave.
function makeOut(): CommandOutput {
  return {
    spin: () => null,
    sendDryRun: () => {},
    sendEvent: () => {},
    sendComplete: () => {},
    deviceState: () => {},
  } as unknown as CommandOutput;
}

// WalletAdapter test double recording the intent passed to prepareSend (the dry-run entrypoint).
function makeWallet(): { wallet: WalletAdapter; intents: TransactionIntent[] } {
  const intents: TransactionIntent[] = [];
  const wallet = {
    prepareSend: (_descriptor: AccountDescriptor, intent: TransactionIntent) => {
      intents.push(intent);
      return Promise.resolve({ amount: "1 SOL", fees: "0.00001 SOL", recipient: "" });
    },
  } as unknown as WalletAdapter;
  return { wallet, intents };
}

describe("depositSolana", () => {
  it("builds a stake.createAccount intent with the validator and dry-runs without a device", async () => {
    const { wallet, intents } = makeWallet();
    const result = await depositSolana({
      descriptor: DESCRIPTOR,
      network: "solana:main",
      validator: "voteAcc123",
      amount: "1.5 SOL",
      dryRun: true,
      wallet,
      out: makeOut(),
    });

    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject({
      family: "solana",
      mode: "stake.createAccount",
      validator: "voteAcc123",
      amount: "1.5 SOL",
      recipient: "",
    });
    expect(result).toMatchObject({
      family: "solana",
      account: DESCRIPTOR.id,
      network: "solana:main",
      amount: "1.5 SOL",
      product: "voteAcc123",
      validator: "voteAcc123",
      dryRun: true,
      status: "dry-run",
      transactions: [{ kind: "stake.createAccount", status: "dry-run" }],
    });
  });

  it("throws a clear error when the validator is missing", async () => {
    const { wallet } = makeWallet();
    await expect(
      depositSolana({
        descriptor: DESCRIPTOR,
        network: "solana:main",
        validator: "",
        amount: "1 SOL",
        dryRun: true,
        wallet,
        out: makeOut(),
      }),
    ).rejects.toThrow(/validator/i);
  });
});

describe("withdrawSolana", () => {
  it("defaults to a stake.undelegate intent (deactivate phase)", async () => {
    const { wallet, intents } = makeWallet();
    const result = await withdrawSolana({
      descriptor: DESCRIPTOR,
      network: "solana:main",
      stakeAccount: "stakeAcc456",
      finalize: false,
      dryRun: true,
      wallet,
      out: makeOut(),
    });

    expect(intents[0]).toMatchObject({
      family: "solana",
      mode: "stake.undelegate",
      stakeAccount: "stakeAcc456",
      // no --amount provided -> "0 <TICKER>" placeholder that satisfies the intent schema
      amount: "0 SOL",
      recipient: "",
    });
    expect(result).toMatchObject({
      family: "solana",
      stakeAccount: "stakeAcc456",
      finalize: false,
      dryRun: true,
      status: "dry-run",
      transactions: [{ kind: "stake.undelegate", status: "dry-run" }],
    });
    expect(result.amount).toBeUndefined();
  });

  it("builds a stake.withdraw intent when finalizing", async () => {
    const { wallet, intents } = makeWallet();
    const result = await withdrawSolana({
      descriptor: DESCRIPTOR,
      network: "solana:main",
      stakeAccount: "stakeAcc456",
      finalize: true,
      dryRun: true,
      wallet,
      out: makeOut(),
    });

    expect(intents[0]).toMatchObject({
      family: "solana",
      mode: "stake.withdraw",
      stakeAccount: "stakeAcc456",
    });
    expect(result).toMatchObject({
      finalize: true,
      transactions: [{ kind: "stake.withdraw", status: "dry-run" }],
    });
  });

  it("throws a clear error when the stake account is missing", async () => {
    const { wallet } = makeWallet();
    await expect(
      withdrawSolana({
        descriptor: DESCRIPTOR,
        network: "solana:main",
        stakeAccount: "",
        finalize: false,
        dryRun: true,
        wallet,
        out: makeOut(),
      }),
    ).rejects.toThrow(/stake account/i);
  });

  it.each([false, true])(
    "rejects --amount as unsupported partial withdraw (finalize=%s)",
    async finalize => {
      const { wallet, intents } = makeWallet();
      await expect(
        withdrawSolana({
          descriptor: DESCRIPTOR,
          network: "solana:main",
          stakeAccount: "stakeAcc456",
          amount: "1 SOL",
          finalize,
          dryRun: true,
          wallet,
          out: makeOut(),
        }),
      ).rejects.toThrow(/partial Solana withdraw is unsupported/i);
      // No intent should be built/dry-run when the amount is rejected.
      expect(intents).toHaveLength(0);
    },
  );
});
