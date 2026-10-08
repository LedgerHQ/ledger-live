import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import type { Account, TokenAccount, TransactionStatusCommon } from "@ledgerhq/types-live";
import {
  AmountRequired,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { getConfidentialSendRuntime, getSpendableConfidentialBalance } from "./runtime";

/** Balance-type option ids, recorded on `familySpecificData.balanceType`. */
export const PUBLIC_SOURCE = "public";
export const CONFIDENTIAL_SOURCE = "confidential";

/** The private part must be revealed before it can be spent. */
export class ConfidentialBalanceNotRevealed extends Error {
  override name = "ConfidentialBalanceNotRevealed";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getSelectedSource(transaction: unknown): string | null {
  if (!isRecord(transaction) || !isRecord(transaction.familySpecificData)) return null;
  const source = transaction.familySpecificData.balanceType;
  return typeof source === "string" ? source : null;
}

export const isConfidentialSend = (transaction: unknown): boolean =>
  getSelectedSource(transaction) === CONFIDENTIAL_SOURCE;

function getTokenAccount(account: Account, transaction: Record<string, unknown>): TokenAccount {
  const subAccount = account.subAccounts?.find(sub => sub.id === transaction.subAccountId);
  if (!subAccount) throw new Error("a confidential send draws from a token account");
  return subAccount;
}

const toBigNumber = (value: unknown): BigNumber =>
  BigNumber.isBigNumber(value) ? value : new BigNumber(0);

/** The underlying amount sent: the whole private part when the user picked max. */
function getAmount(transaction: Record<string, unknown>, privateBalance: BigNumber): BigNumber {
  return transaction.useAllAmount ? privateBalance : toBigNumber(transaction.amount);
}

/** Validates a confidential send against the revealed private balance, not the public one. */
export async function getConfidentialTransactionStatus(
  account: Account,
  transaction: Record<string, unknown>,
): Promise<TransactionStatusCommon | undefined> {
  if (!isConfidentialSend(transaction)) return undefined;
  const tokenAccount = getTokenAccount(account, transaction);
  const balance = getSpendableConfidentialBalance(tokenAccount);
  const privateBalance = balance
    ? new BigNumber(balance.underlyingValue.toString())
    : new BigNumber(0);
  const amount = getAmount(transaction, privateBalance);
  const recipient = typeof transaction.recipient === "string" ? transaction.recipient : "";

  const errors: Record<string, Error> = {};
  if (!recipient) errors.recipient = new RecipientRequired();
  else if (!ethers.isAddress(recipient)) errors.recipient = new InvalidAddress();
  if (!balance) errors.amount = new ConfidentialBalanceNotRevealed();
  else if (amount.lte(0)) errors.amount = new AmountRequired();
  else if (amount.gt(privateBalance)) errors.amount = new NotEnoughBalance();

  return {
    errors,
    warnings: {},
    estimatedFees: toBigNumber(transaction.fees),
    amount,
    totalSpent: amount,
  };
}

/** The unsigned confidential transfer, prepared with its attested amount by the host's client. */
export async function craftConfidentialTransaction(
  account: Account,
  transaction: Record<string, unknown>,
): Promise<{ transaction: string; sequence: bigint } | undefined> {
  if (!isConfidentialSend(transaction)) return undefined;
  const runtime = getConfidentialSendRuntime();
  const tokenAccount = getTokenAccount(account, transaction);
  const balance = getSpendableConfidentialBalance(tokenAccount);
  if (!runtime || !balance) throw new ConfidentialBalanceNotRevealed();

  const amount = getAmount(transaction, new BigNumber(balance.underlyingValue.toString()));
  const prepared = await runtime.prepareSend(account.currency.id, {
    sender: account.freshAddress,
    recipient: String(transaction.recipient),
    underlying: tokenAccount.token.contractAddress,
    amount: BigInt(amount.toFixed(0)),
    balance,
  });
  return {
    transaction: prepared.transaction,
    sequence: BigInt(ethers.Transaction.from(prepared.transaction).nonce),
  };
}
