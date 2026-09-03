import type { TransferFee } from "../../bridge/generic-coin-framework/types";
import type { Transaction } from "./types";
import type BigNumber from "bignumber.js";

/**
 * The Solana transaction shape the generic coin framework reads, in one place so screens never
 * spell it out. Delegating is the odd one: `recipient` is the validator and the stake account
 * travels as a memo (`coin-solana/logic/craftTransaction.ts`).
 */

export const STAKE_ACCOUNT_MEMO_TYPE = "STAKE_ACCOUNT";

export function createStakeAccountTransaction(voteAccAddr: string, amount?: BigNumber) {
  return {
    mode: "stake" as const,
    recipient: voteAccAddr,
    ...(amount ? { amount } : {}),
  };
}

export function delegateTransaction(stakeAccAddr: string, voteAccAddr: string) {
  return {
    mode: "delegate" as const,
    recipient: voteAccAddr,
    memoType: STAKE_ACCOUNT_MEMO_TYPE,
    memoValue: stakeAccAddr,
  };
}

export function undelegateTransaction(stakeAccAddr: string) {
  return {
    mode: "undelegate" as const,
    recipient: stakeAccAddr,
  };
}

export function withdrawTransaction(stakeAccAddr: string, amount: BigNumber) {
  return {
    mode: "unstake" as const,
    recipient: stakeAccAddr,
    amount,
  };
}

export const TEXT_MEMO_TYPE = "TEXT";

/** Stake account this transaction acts on: the memo when delegating, the recipient otherwise. */
export function getTransactionStakeAccount({
  mode,
  recipient,
  memoValue,
}: Pick<Transaction, "mode" | "recipient" | "memoValue">): string | undefined {
  if (mode === "delegate") return memoValue ?? undefined;
  return mode === "undelegate" || mode === "unstake" ? recipient : undefined;
}

/** Vote account of the validator this transaction delegates to, if any. */
export function getTransactionValidator({
  mode,
  recipient,
}: Pick<Transaction, "mode" | "recipient">): string | undefined {
  return mode === "stake" || mode === "delegate" ? recipient : undefined;
}

/** A plain SOL or SPL transfer, i.e. not one of the staking flows above. */
export function isTransferTransaction({ mode }: Transaction): boolean {
  return mode === undefined || mode === "send";
}

/** A transfer of an SPL / Token-2022 asset rather than of SOL itself. */
export function isTokenTransferTransaction(transaction: Transaction): boolean {
  return isTransferTransaction(transaction) && Boolean(transaction.subAccountId);
}

/**
 * The memo the user typed. Delegating reuses the memo to carry the stake account
 * (`STAKE_ACCOUNT_MEMO_TYPE`), which is internal plumbing and must never surface as a user memo.
 */
export function getTransactionMemo({ memoType, memoValue }: Transaction): string {
  return memoType === TEXT_MEMO_TYPE ? (memoValue ?? "") : "";
}

export function setTransactionMemo(memo: string) {
  return { memoType: TEXT_MEMO_TYPE, memoValue: memo };
}

/** Set by `estimateFees` and propagated onto the transaction by the generic bridge. */
export function getTransactionTransferFee({ transferFee }: Transaction): TransferFee | undefined {
  return transferFee;
}
