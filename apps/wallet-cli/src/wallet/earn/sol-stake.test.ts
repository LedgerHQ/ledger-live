import { describe, expect, it } from "bun:test";
import { BigNumberStrSchema } from "@shared/schema-primitives";
import type { WalletAdapter } from "../index";
import type { AccountDescriptor } from "../models";
import type { TransactionIntent } from "../intents";
import type { CommandOutput } from "../../output";
import type { SolanaStakeLimits } from "./types";
import { depositSolana, describeStakeAmountError, withdrawSolana } from "./sol-stake";

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

const MAINNET_LIMITS: Record<keyof SolanaStakeLimits, string> = {
  minimumDelegation: "1000000000",
  rent: "1666240",
  spendableBalance: "50929500",
  maxStakeable: "49243260",
  feeReserve: "20000",
};

function limits(
  overrides: Partial<Record<keyof SolanaStakeLimits, string>> = {},
): SolanaStakeLimits {
  const raw = { ...MAINNET_LIMITS, ...overrides };
  return {
    minimumDelegation: BigNumberStrSchema.parse(raw.minimumDelegation),
    rent: BigNumberStrSchema.parse(raw.rent),
    spendableBalance: BigNumberStrSchema.parse(raw.spendableBalance),
    maxStakeable: BigNumberStrSchema.parse(raw.maxStakeable),
    feeReserve: BigNumberStrSchema.parse(raw.feeReserve),
  };
}

function namedError(name: string): Error {
  const err = new Error(name);
  err.name = name;
  return err;
}

function makeFailingWallet(error: unknown, stakeLimits: () => Promise<SolanaStakeLimits>) {
  return {
    prepareSend: () => Promise.reject(error),
    getSolanaStakeLimits: stakeLimits,
  } as unknown as WalletAdapter;
}

const depositDryRun = (wallet: WalletAdapter, amount: string) =>
  depositSolana({
    descriptor: DESCRIPTOR,
    network: "solana:main",
    validator: "voteAcc123",
    amount,
    dryRun: true,
    wallet,
    out: makeOut(),
  });

const NON_BREAKING_SPACE = /\u00a0/g;
const describeReadable = (...args: Parameters<typeof describeStakeAmountError>) =>
  describeStakeAmountError(...args).replace(NON_BREAKING_SPACE, " ");

describe("describeStakeAmountError", () => {
  it("states the network minimum delegation for an amount below it", () => {
    const message = describeReadable(
      "SolanaStakeAccountAmountTooLow",
      "0.01 SOL",
      limits(),
      "solana",
    );
    expect(message).toContain("Solana requires at least 1 SOL per stake account");
    expect(message).toContain("Requested 0.01 SOL.");
  });

  it("breaks the max stakeable down into balance, rent and fee reserve", () => {
    const message = describeReadable("NotEnoughBalance", "0.06 SOL", limits(), "solana");
    expect(message).toContain(
      "Max stakeable is 0.04924326 SOL: spendable balance 0.0509295 SOL minus stake account rent " +
        "0.00166624 SOL and fee reserve 0.00002 SOL.",
    );
    expect(message).toContain("Requested 0.06 SOL.");
  });

  it.each(["SolanaStakeAccountAmountTooLow", "NotEnoughBalance"] as const)(
    "adds the SOL still missing when the max stakeable is under the minimum (%s)",
    name => {
      const message = describeReadable(name, "0.01 SOL", limits(), "solana");
      expect(message).toContain(
        "This account cannot stake until it receives at least ~0.95075674 SOL more.",
      );
    },
  );

  it("gives a lower bound instead of a shortfall when nothing is stakeable", () => {
    const message = describeReadable(
      "NotEnoughBalance",
      "0.01 SOL",
      limits({ spendableBalance: "0", maxStakeable: "0", feeReserve: "0" }),
      "solana",
    );
    expect(message).toContain(
      "This account cannot stake until it receives more than 1.00166624 SOL (minimum plus " +
        "stake account rent), plus network fees.",
    );
  });

  it("omits the funding hint once the account can reach the minimum", () => {
    const message = describeReadable(
      "SolanaStakeAccountAmountTooLow",
      "0.5 SOL",
      limits({ spendableBalance: "2000000000", maxStakeable: "1998313760" }),
      "solana",
    );
    expect(message).not.toContain("cannot stake");
  });
});

describe("depositSolana stake amount errors", () => {
  it.each(["SolanaStakeAccountAmountTooLow", "NotEnoughBalance"])(
    "restates %s with the stake limits and keeps its name",
    async name => {
      const cause = namedError(name);
      const wallet = makeFailingWallet(cause, () => Promise.resolve(limits()));
      await expect(depositDryRun(wallet, "0.01 SOL")).rejects.toMatchObject({
        name,
        cause,
        message: expect.stringContaining("Requested 0.01 SOL."),
      });
    },
  );

  it("rethrows the original error when the limits lookup fails", async () => {
    const cause = namedError("SolanaStakeAccountAmountTooLow");
    const wallet = makeFailingWallet(cause, () => Promise.reject(new Error("rpc down")));
    await expect(depositDryRun(wallet, "0.01 SOL")).rejects.toBe(cause);
  });

  it("leaves unrelated errors untouched", async () => {
    const cause = namedError("SolanaInvalidValidator");
    let lookedUp = false;
    const wallet = makeFailingWallet(cause, () => {
      lookedUp = true;
      return Promise.resolve(limits());
    });
    await expect(depositDryRun(wallet, "1 SOL")).rejects.toBe(cause);
    expect(lookedUp).toBe(false);
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
