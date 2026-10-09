import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import type { Account, TokenAccount, TransactionStatusCommon } from "@ledgerhq/types-live";
import type { FamilyCraftedTransaction } from "@ledgerhq/ledger-wallet-framework/api/types";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies/index";
import {
  AmountRequired,
  InvalidAddress,
  NotEnoughBalance,
  NotEnoughGas,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import {
  getConfidentialSendRuntime,
  getSpendableConfidentialBalance,
  hasConfidentialPart,
} from "./runtime";

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

/**
 * A confidential send to the account's own public part is an unshield. The send flow records the
 * self-transfer shortcut on `selfTransfer`, since both parts share one address.
 */
export const isUnshield = (transaction: unknown): boolean =>
  isConfidentialSend(transaction) && isRecord(transaction) && transaction.selfTransfer === true;

/** A public send to the account's own private part is a shield: approve, then wrap. */
export const isShield = (transaction: unknown): boolean =>
  getSelectedSource(transaction) === PUBLIC_SOURCE &&
  isRecord(transaction) &&
  transaction.selfTransfer === true;

// Unshield requests crafted and not yet signed, by unsigned payload: signing only returns the
// signed payload, and the host needs the account and the wrapper amount to follow the request.
const unshieldRequests = new Map<string, { tokenAccountId: string; amount: bigint }>();

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

/** The parent account pays the network fees in its native currency, as on the generic path. */
function getGasError(account: Account, transaction: Record<string, unknown>): Error | undefined {
  const fees = toBigNumber(transaction.fees);
  if (fees.lte(account.spendableBalance)) return undefined;
  const unit = account.currency.units[0];
  return new NotEnoughGas(undefined, {
    fees: unit ? formatCurrencyUnit(unit, fees) : fees.toFixed(),
    ticker: account.currency.ticker,
    cryptoName: account.currency.name,
    links: ["ledgerlive://buy"],
  });
}

/** A shield spends the public token balance; the device signs approve and wrap, not a transfer. */
function getShieldStatus(account: Account, transaction: Record<string, unknown>) {
  const tokenAccount = getTokenAccount(account, transaction);
  const publicBalance = tokenAccount.spendableBalance;
  const amount = transaction.useAllAmount ? publicBalance : toBigNumber(transaction.amount);
  const errors: Record<string, Error> = {};
  if (!hasConfidentialPart(tokenAccount)) errors.amount = new ConfidentialBalanceNotRevealed();
  else if (amount.lte(0)) errors.amount = new AmountRequired();
  else if (amount.gt(publicBalance)) errors.amount = new NotEnoughBalance();
  const gasError = getGasError(account, transaction);
  if (gasError) errors.gasPrice = gasError;
  return {
    errors,
    warnings: {},
    estimatedFees: toBigNumber(transaction.fees),
    amount,
    totalSpent: amount,
  };
}

/** Validates a confidential send against the revealed private balance, not the public one. */
export async function getConfidentialTransactionStatus(
  account: Account,
  transaction: Record<string, unknown>,
): Promise<TransactionStatusCommon | undefined> {
  if (isShield(transaction)) return getShieldStatus(account, transaction);
  if (!isConfidentialSend(transaction)) return undefined;
  const tokenAccount = getTokenAccount(account, transaction);
  const balance = getSpendableConfidentialBalance(tokenAccount);
  const privateBalance = balance
    ? new BigNumber(balance.underlyingValue.toString())
    : new BigNumber(0);
  const amount = getAmount(transaction, privateBalance);
  // An unshield pays the public part of the sending address, whatever the recipient field holds.
  const recipient = isUnshield(transaction)
    ? account.freshAddress
    : typeof transaction.recipient === "string"
      ? transaction.recipient
      : "";

  const errors: Record<string, Error> = {};
  if (!recipient) errors.recipient = new RecipientRequired();
  else if (!ethers.isAddress(recipient)) errors.recipient = new InvalidAddress();
  if (!balance) errors.amount = new ConfidentialBalanceNotRevealed();
  else if (amount.lte(0)) errors.amount = new AmountRequired();
  else if (amount.gt(privateBalance)) errors.amount = new NotEnoughBalance();
  const gasError = getGasError(account, transaction);
  if (gasError) errors.gasPrice = gasError;

  return {
    errors,
    warnings: {},
    estimatedFees: toBigNumber(transaction.fees),
    amount,
    totalSpent: amount,
  };
}

const nonceOf = (unsigned: string): bigint => BigInt(ethers.Transaction.from(unsigned).nonce);

/** Approve (unless the allowance covers it) as a prerequisite, then the wrap the operation stands for. */
async function craftShield(
  account: Account,
  transaction: Record<string, unknown>,
): Promise<FamilyCraftedTransaction> {
  const runtime = getConfidentialSendRuntime();
  const tokenAccount = getTokenAccount(account, transaction);
  if (!runtime || !hasConfidentialPart(tokenAccount)) throw new ConfidentialBalanceNotRevealed();
  const amount = transaction.useAllAmount
    ? tokenAccount.spendableBalance
    : toBigNumber(transaction.amount);
  const {
    transactions: [approve, wrap],
  } = await runtime.prepareShield(account.currency.id, {
    sender: account.freshAddress,
    underlying: tokenAccount.token.contractAddress,
    amount: BigInt(amount.toFixed(0)),
  });
  return {
    transaction: wrap.transaction,
    sequence: nonceOf(wrap.transaction),
    prerequisites: approve ? [approve.transaction] : [],
  };
}

/** The unsigned confidential transfer, prepared with its attested amount by the host's client. */
export async function craftConfidentialTransaction(
  account: Account,
  transaction: Record<string, unknown>,
): Promise<FamilyCraftedTransaction | undefined> {
  if (isShield(transaction)) return craftShield(account, transaction);
  if (!isConfidentialSend(transaction)) return undefined;
  const runtime = getConfidentialSendRuntime();
  const tokenAccount = getTokenAccount(account, transaction);
  const balance = getSpendableConfidentialBalance(tokenAccount);
  if (!runtime || !balance) throw new ConfidentialBalanceNotRevealed();

  const amount = getAmount(transaction, new BigNumber(balance.underlyingValue.toString()));
  const unshield = isUnshield(transaction);
  const params = {
    sender: account.freshAddress,
    recipient: unshield ? account.freshAddress : String(transaction.recipient),
    underlying: tokenAccount.token.contractAddress,
    amount: BigInt(amount.toFixed(0)),
    balance,
  };
  const prepared = unshield
    ? await runtime.prepareUnshield(account.currency.id, params)
    : await runtime.prepareSend(account.currency.id, params);
  if (unshield) {
    unshieldRequests.set(prepared.transaction, {
      tokenAccountId: tokenAccount.id,
      amount: prepared.amount,
    });
  }
  return {
    transaction: prepared.transaction,
    sequence: nonceOf(prepared.transaction),
  };
}

/** Hands a signed phase-1 unshield to the host, which follows it until it can be finalized. */
export function onConfidentialTransactionSigned(
  _account: Account,
  transaction: Record<string, unknown>,
  signedTransaction: string,
): void {
  if (!isUnshield(transaction)) return;
  const signed = ethers.Transaction.from(signedTransaction);
  const request = unshieldRequests.get(signed.unsignedSerialized);
  if (!request || !signed.hash) return;
  unshieldRequests.delete(signed.unsignedSerialized);
  getConfidentialSendRuntime()?.onUnshieldRequested(request.tokenAccountId, {
    requestTxHash: signed.hash,
    amount: request.amount,
  });
}
