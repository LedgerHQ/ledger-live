import type {
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { BigNumber } from "bignumber.js";
import { buildTransaction } from "../../buildTransaction";
import { getAccessKey } from "../../network";
import type { Transaction } from "../../types";
import { craftTransaction } from "./craftTransaction";

jest.mock("../../network", () => ({ getAccessKey: jest.fn() }));

/**
 * The crafted transaction must be byte-identical to what the account bridge builds.
 *
 * `buildTransaction` is the path that has been signing NEAR transactions in production, so pinning
 * the new `craftTransaction` to its exact Borsh output is the strongest available evidence that the
 * CoinModuleApi signs the same thing the bridge does. The access key is stubbed so both sides see
 * the same nonce and block hash.
 */
const SENDER = "sender.near";
const RECIPIENT = "recipient.near";
const POOL = "astro-stakers.poolv1.near";
const PUBLIC_KEY = "ed25519:HYgHRZBqhvhV4RLsBTz2CoM3JMVYFHDs1QLLZfDdWfPn";
const BLOCK_HASH = "6ykMPuAsmyPvVMSLKvfg7DBUZP9tYcgKNzVLrLxSnLpj";
const NONCE = 41;
const AMOUNT = "5000000000000000000000000";

// Derived from the function rather than imported: `src/logic/**` may not depend on
// @ledgerhq/types-live, and only `freshAddress` is read.
const account = { freshAddress: SENDER } as Parameters<typeof buildTransaction>[0];

const bridgeTx = (mode: string, recipient: string, useAllAmount = false): Transaction =>
  ({
    family: "near",
    mode,
    recipient,
    amount: new BigNumber(AMOUNT),
    useAllAmount,
  }) as Transaction;

const sendIntent = (recipient: string, useAllAmount = false): TransactionIntent =>
  ({
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient,
    amount: BigInt(AMOUNT),
    asset: { type: "native" },
    senderPublicKey: PUBLIC_KEY,
    useAllAmount,
  }) as TransactionIntent;

const stakingIntent = (
  mode: StakingTransactionIntent["mode"],
  useAllAmount = false,
): StakingTransactionIntent =>
  ({
    ...sendIntent(POOL, useAllAmount),
    intentType: "staking",
    type: mode,
    mode,
    valAddress: POOL,
  }) as StakingTransactionIntent;

const bridgeBytes = async (tx: Transaction): Promise<string> =>
  Buffer.from((await buildTransaction(account, tx, PUBLIC_KEY)).encode()).toString("base64");

const apiBytes = async (intent: TransactionIntent | StakingTransactionIntent): Promise<string> =>
  (await craftTransaction(intent)).transaction;

describe("craftTransaction vs buildTransaction (byte parity)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAccessKey as jest.Mock).mockResolvedValue({ nonce: NONCE, block_hash: BLOCK_HASH });
  });

  it("encodes a transfer identically", async () => {
    expect(await apiBytes(sendIntent(RECIPIENT))).toBe(
      await bridgeBytes(bridgeTx("send", RECIPIENT)),
    );
  });

  it.each([
    ["delegate", "stake"],
    ["undelegate", "unstake"],
    ["withdraw", "withdraw"],
  ] as const)("encodes a %s identically to the bridge's %s", async (intentMode, bridgeMode) => {
    expect(await apiBytes(stakingIntent(intentMode))).toBe(
      await bridgeBytes(bridgeTx(bridgeMode, POOL)),
    );
  });

  it.each([
    ["undelegate", "unstake"],
    ["withdraw", "withdraw"],
  ] as const)("encodes a %s with useAllAmount identically", async (intentMode, bridgeMode) => {
    expect(await apiBytes(stakingIntent(intentMode, true))).toBe(
      await bridgeBytes(bridgeTx(bridgeMode, POOL, true)),
    );
  });

  it("encodes a transfer to an implicit account identically", async () => {
    const implicit = "4e7de0a21d8a20f970c86b6edf407906d7ba9e205979c3268270eef80a286e2d";

    expect(await apiBytes(sendIntent(implicit))).toBe(
      await bridgeBytes(bridgeTx("send", implicit)),
    );
  });
});
