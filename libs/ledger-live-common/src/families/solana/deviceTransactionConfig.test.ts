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

  // The device signs the delegated amount plus the stake account's rent, so the wallet must show
  // the sum -- an `amount` field would render `status.amount` and understate it by the rent.
  it("describes a stake account creation, rent included in the deposit", async () => {
    const transaction = {
      ...createStakeAccountTransaction("vote-acc", new BigNumber(1_000_000_000)),
      stakeAccountRent: new BigNumber(2_282_880),
    };

    const fields = await run(transaction);

    // The separator between figure and ticker is a non-breaking space, so match on the figure.
    expect(fields[0]).toMatchObject({ type: "text", label: "Deposit" });
    expect((fields[0] as { value: string }).value).toContain("1.00228288");
    expect(fields.slice(1)).toEqual([
      { type: "address", label: "New authority", address: "owner-addr" },
      { type: "address", label: "Vote account", address: "vote-acc" },
    ]);
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

  // A partner built the transaction; nothing in the intent describes what the device will show.
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

  // The device shows the stake account the split opens; without `stakeAccountAddress` the app
  // omitted the row and the user confirmed an address never shown.
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
});
