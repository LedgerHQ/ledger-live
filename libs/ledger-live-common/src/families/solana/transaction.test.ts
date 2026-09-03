import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { fromTransactionRaw, toTransactionRaw, formatTransaction } from "./transaction";
import { STAKE_ACCOUNT_MEMO_TYPE, TEXT_MEMO_TYPE } from "./transactions";
import type { Transaction, TransactionRaw } from "./types";

const rawBase = {
  family: "solana",
  amount: "1000000",
  recipient: "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ",
  useAllAmount: false,
} as unknown as TransactionRaw;

const account = {
  type: "Account",
  freshAddress: "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM",
  currency: { units: [{ code: "SOL", magnitude: 9, name: "SOL" }] },
  subAccounts: [],
} as unknown as Account;

describe("solana transaction serialization", () => {
  // This is the assertion the shared `testBridge` dataset used to carry for Solana. Losing it is
  // how the module kept pointing at the legacy `model`-based serializer unnoticed.
  it.each([
    ["a plain send", { mode: "send" }],
    ["a token send with a memo", { mode: "send", memoType: TEXT_MEMO_TYPE, memoValue: "hello" }],
    ["a stake account creation", { mode: "stake" }],
    [
      "a delegation, whose stake account travels as a memo",
      { mode: "delegate", memoType: STAKE_ACCOUNT_MEMO_TYPE, memoValue: "stakeAcc" },
    ],
    ["a deactivation", { mode: "undelegate" }],
    ["a withdrawal", { mode: "unstake" }],
  ])("round-trips %s", (_label, fields) => {
    const raw = { ...rawBase, ...fields } as unknown as TransactionRaw;

    const transaction = fromTransactionRaw(raw);

    expect(transaction).toMatchObject(fields);
    expect(toTransactionRaw(transaction)).toEqual(raw);
  });

  it("revives the amount as a BigNumber", () => {
    expect(fromTransactionRaw(rawBase).amount).toEqual(new BigNumber(1_000_000));
  });

  it("omits the mode and memo fields rather than writing them undefined", () => {
    expect(toTransactionRaw(fromTransactionRaw(rawBase))).toEqual(rawBase);
  });
});

describe("solana formatTransaction", () => {
  const base = {
    family: "solana",
    amount: new BigNumber(1_000_000),
    recipient: "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ",
    useAllAmount: false,
  } as unknown as Transaction;

  // It runs inside a template string on every signing, so a throw or a Promise breaks the log line.
  it("never throws on an unprepared transaction", () => {
    expect(() => formatTransaction(base, account)).not.toThrow();
    expect(typeof formatTransaction(base, account)).toBe("string");
  });

  it("names the mode and the recipient", () => {
    const summary = formatTransaction({ ...base, mode: "send" }, account);

    expect(summary).toContain("SEND");
    expect(summary).toContain(base.recipient);
  });

  it("shows MAX rather than a figure when sending everything", () => {
    expect(formatTransaction({ ...base, useAllAmount: true }, account)).toContain("MAX");
  });

  // The stake account rides in the memo field; it must read as a stake account, not as a user memo.
  it("does not present a delegation's stake account as a memo", () => {
    const summary = formatTransaction(
      {
        ...base,
        mode: "delegate",
        memoType: STAKE_ACCOUNT_MEMO_TYPE,
        memoValue: "stakeAcc",
      } as unknown as Transaction,
      account,
    );

    expect(summary).toContain("STAKE ACCOUNT stakeAcc");
    expect(summary).not.toContain("MEMO");
  });

  it("shows a user memo", () => {
    const summary = formatTransaction(
      { ...base, mode: "send", memoType: TEXT_MEMO_TYPE, memoValue: "hello" } as Transaction,
      account,
    );

    expect(summary).toContain("MEMO hello");
  });
});
