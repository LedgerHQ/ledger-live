import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import getDeviceTransactionConfig from "./deviceTransactionConfig";
import {
  createStakeAccountTransaction,
  delegateTransaction,
  splitStakeTransaction,
  undelegateTransaction,
  withdrawTransaction,
} from "./transactions";
import BigNumber from "bignumber.js";

const account = {
  type: "Account",
  freshAddress: "owner-addr",
  currency: {
    family: "solana",
    units: [{ code: "SOL", magnitude: 9, name: "SOL" }],
  },
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

  it("describes a stake account creation, rent included in the deposit", async () => {
    const transaction = {
      ...createStakeAccountTransaction("vote-acc", new BigNumber(1_000_000_000)),
      stakeAccountRent: new BigNumber(2_282_880),
    };

    const fields = await run(transaction);

    expect(fields[0]).toMatchObject({ type: "text", label: "Deposit" });
    expect((fields[0] as { value: string }).value).toContain("1.00228288");
    expect(fields.slice(1)).toEqual([
      { type: "address", label: "New authority", address: "owner-addr" },
      { type: "address", label: "Vote account", address: "vote-acc" },
    ]);
  });

  it("shows only the amount on a send-max creation, the rent already inside it", async () => {
    const fields = await run({
      ...createStakeAccountTransaction("vote-acc", new BigNumber(1_000_000_000)),
      stakeAccountRent: new BigNumber(2_282_880),
      useAllAmount: true,
    });

    expect((fields[0] as { value: string }).value).not.toContain("1.00228288");
  });

  it("names the stake account being opened, as the legacy bridge did", async () => {
    const fields = await run({
      ...createStakeAccountTransaction("vote-acc", new BigNumber(1_000_000_000)),
      stakeAccountRent: new BigNumber(2_282_880),
      feeParameters: { stakeAccountAddress: "new-stake-acc" },
    });

    expect(fields[0]).toEqual({
      type: "address",
      label: "Delegate from",
      address: "new-stake-acc",
    });
  });

  it("falls back to the amount alone when the rent is not known yet", async () => {
    const fields = await run(
      createStakeAccountTransaction("vote-acc", new BigNumber(1_000_000_000)),
    );

    expect((fields[0] as { value: string }).value).toContain("1");
    expect((fields[0] as { value: string }).value).not.toContain("1.0022");
  });

  it("claims nothing about a partner-built transaction", async () => {
    expect(await run({ mode: "send", recipient: "dest", raw: "AQID" })).toEqual([]);
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

  it("describes a split, the account it opens included", async () => {
    const split = splitStakeTransaction("stake-acc", new BigNumber(1));
    const fields = await run({
      ...split,
      feeParameters: { stakeAccountAddress: "new-stake-acc" },
    });

    expect(fields).toEqual([
      { type: "amount", label: "Split stake" },
      { type: "address", label: "From", address: "stake-acc" },
      { type: "address", label: "To", address: "new-stake-acc" },
      { type: "address", label: "Base", address: "owner-addr" },
      {
        type: "text",
        label: "Seed",
        value: split.familySpecificData.stakeAccountSeed,
      },
      { type: "address", label: "Authorized by", address: "owner-addr" },
      { type: "address", label: "Fee payer", address: "owner-addr" },
    ]);
  });

  it("describes a withdrawal", async () => {
    expect(await run(withdrawTransaction("stake-acc", new BigNumber(1)))).toEqual([
      { type: "amount", label: "Stake withdraw" },
      { type: "address", label: "From", address: "stake-acc" },
    ]);
  });

  it("describes a token account opening", async () => {
    expect(await run({ mode: "opt-in", ownerTokenAccount: "ata", assetReference: "mint" })).toEqual(
      [
        { type: "address", label: "Create token acct", address: "ata" },
        { type: "address", label: "From mint", address: "mint" },
        { type: "address", label: "Owned by", address: "owner-addr" },
        { type: "address", label: "Funded by", address: "owner-addr" },
        { type: "address", label: "Fee payer", address: "owner-addr" },
      ],
    );
  });

  it("describes a token approval", async () => {
    expect(await run({ mode: "approve", ownerTokenAccount: "ata", recipient: "spender" })).toEqual([
      { type: "address", label: "Approve token account", address: "ata" },
      { type: "address", label: "Owned by", address: "owner-addr" },
      { type: "address", label: "Delegate to", address: "spender" },
      { type: "amount", label: "Amount" },
    ]);
  });

  it("describes a revocation, without the token account when it is not known yet", async () => {
    expect(await run({ mode: "revoke" })).toEqual([
      { type: "address", label: "Owned by", address: "owner-addr" },
    ]);
  });
});
