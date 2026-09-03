import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import {
  createStakeAccountTransaction,
  delegateTransaction,
  undelegateTransaction,
  withdrawTransaction,
} from "./transactions";
import BigNumber from "bignumber.js";

const account = {
  type: "Account",
  freshAddress: "owner-addr",
  currency: { family: "solana" },
} as unknown as Account;

const run = (transaction: unknown, accountLike: AccountLike = account) =>
  getDeviceTransactionConfig({
    account: accountLike,
    parentAccount: null,
    transaction: transaction as Transaction,
  });

describe("solana deviceTransactionConfig", () => {
  it("describes a SOL transfer", async () => {
    expect(await run({ mode: "send", recipient: "dest" })).toEqual([
      { type: "amount", label: "Transfer" },
    ]);
  });

  it("describes an SPL transfer, with the transfer fee when the mint charges one", async () => {
    expect(
      await run({
        mode: "send",
        recipient: "dest",
        subAccountId: "sub",
        transferFee: { feeBps: 0 },
      }),
    ).toEqual([
      { type: "amount", label: "Transfer tokens" },
      { type: "text", value: "Solana", label: "Network" },
      { type: "fees", label: "Max network fees" },
    ]);

    expect(
      await run({
        mode: "send",
        recipient: "dest",
        subAccountId: "sub",
        transferFee: { feeBps: 100 },
      }),
    ).toContainEqual({ type: "solana.token.transferFee", label: "Transfer fee" });
  });

  it("describes a stake account creation", async () => {
    expect(await run(createStakeAccountTransaction("vote-acc", new BigNumber(1)))).toEqual([
      { type: "amount", label: "Deposit" },
      { type: "address", label: "New authority", address: "owner-addr" },
      { type: "address", label: "Vote account", address: "vote-acc" },
    ]);
  });

  it("describes a delegation, whose stake account travels as a memo", async () => {
    expect(await run(delegateTransaction("stake-acc", "vote-acc"))).toEqual([
      { type: "address", label: "Delegate from", address: "stake-acc" },
      { type: "address", label: "Vote account", address: "vote-acc" },
    ]);
  });

  it("describes a deactivation", async () => {
    expect(await run(undelegateTransaction("stake-acc"))).toEqual([
      { type: "address", label: "Deactivate stake", address: "stake-acc" },
    ]);
  });

  it("describes a withdrawal", async () => {
    expect(await run(withdrawTransaction("stake-acc", new BigNumber(1)))).toEqual([
      { type: "amount", label: "Stake withdraw" },
      { type: "address", label: "From", address: "stake-acc" },
    ]);
  });
});
