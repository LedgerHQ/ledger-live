import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account, Operation, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { fromBigNumberToBigInt } from "@ledgerhq/coin-framework/utils";
import {
  Balance,
  Operation as CoreOperation,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/types";
import { findCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { GenericTransaction, OperationCommon } from "./types";

export function findCryptoCurrencyByNetwork(network: string): CryptoCurrency | undefined {
  const networksRemap = {
    xrp: "ripple",
  };
  return findCryptoCurrencyById(networksRemap[network] ?? network);
}

export function extractBalance(balances: Balance[], type: string): Balance {
  return (
    balances.find(balance => balance.asset.type === type) ?? {
      asset: { type },
      value: 0n,
    }
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === "string");
}

export function cleanedOperation(operation: OperationCommon): OperationCommon {
  if (!operation.extra) return operation;

  const extraToClean = new Set([
    "assetReference",
    "assetAmount",
    "assetOwner",
    "assetSenders",
    "assetRecipients",
    "parentSenders",
    "parentRecipients",
    "ledgerOpType",
  ]);
  const cleanedExtra = Object.fromEntries(
    Object.entries(operation.extra).filter(([key]) => !extraToClean.has(key)),
  );

  return { ...operation, extra: cleanedExtra };
}

export function adaptCoreOperationToLiveOperation(accountId: string, op: CoreOperation): Operation {
  const opType = op.type as OperationType;

  const extra: {
    assetReference?: string;
    assetOwner?: string;
    assetAmount?: string | undefined;
    assetSenders?: string[];
    assetRecipients?: string[];
    parentSenders?: string[];
    parentRecipients?: string[];
    ledgerOpType?: string | undefined;
    memo?: string | undefined;
  } = {};

  if (op.details?.ledgerOpType !== undefined) {
    extra.ledgerOpType = op.details.ledgerOpType as string;
  }

  if (op.details?.assetAmount !== undefined) {
    extra.assetAmount = op.details.assetAmount as string;
  }

  if (isStringArray(op.details?.assetSenders)) {
    extra.assetSenders = op.details?.assetSenders;
  }

  if (isStringArray(op.details?.assetRecipients)) {
    extra.assetRecipients = op.details?.assetRecipients;
  }

  if (isStringArray(op.details?.parentSenders)) {
    extra.parentSenders = op.details?.parentSenders;
  }

  if (isStringArray(op.details?.parentRecipients)) {
    extra.parentRecipients = op.details?.parentRecipients;
  }

  if (op.asset?.type !== "native") {
    extra.assetReference =
      "assetReference" in (op.asset ?? {}) ? (op.asset as any).assetReference : "";
    extra.assetOwner = "assetOwner" in (op.asset ?? {}) ? (op.asset as any).assetOwner : "";
  }
  if (op.details?.memo) {
    extra.memo = op.details.memo as string;
  }
  const bnFees = new BigNumber(op.tx.fees.toString());
  const res = {
    id: encodeOperationId(accountId, op.tx.hash, op.type),
    hash: op.tx.hash,
    accountId,
    type: opType,
    value:
      op.asset.type === "native" && ["OUT", "FEES", "DELEGATE", "UNDELEGATE"].includes(opType)
        ? new BigNumber(op.value.toString()).plus(bnFees)
        : new BigNumber(op.value.toString()),
    fee: bnFees,
    blockHash: op.tx.block.hash,
    blockHeight: op.tx.block.height,
    senders: extra.parentSenders ?? op.senders,
    recipients: extra.parentRecipients ?? op.recipients,
    date: op.tx.date,
    transactionSequenceNumber: op.details?.sequence as number,
    hasFailed: op.details?.status === "failed",
    extra,
  };

  return res;
}

/**
 * Default implementation of `computeIntentType` is a simple whitelist
 * with a fallback to "Payment"
 */
function defaultComputeIntentType(transaction: GenericTransaction): string {
  if (!transaction.mode) return "Payment"; // NOTE: assuming payment by default here, can be changed based on transaction.mode

  const modeRemap = {
    delegate: "stake",
    undelegate: "unstake",
  };
  const mode = modeRemap[transaction.mode] ?? transaction.mode;

  if (["changeTrust", "send", "send-legacy", "send-eip1559", "stake", "unstake"].includes(mode))
    return mode;

  throw new Error(`Unsupported transaction mode: ${transaction.mode}`);
}

/**
 * Converts a transaction object into a `TransactionIntent` object, which is used to represent
 * the intent of a transaction in a standardized format.
 *
 * @template MemoType - The type of memo supported by the transaction, defaults to `MemoNotSupported`.
 *
 * @param account - The account initiating the transaction. Contains details such as the sender's address.
 * @param transaction - The transaction object containing details about the operation to be performed.
 *   - `assetOwner` (optional): The issuer of the asset, if applicable.
 *   - `assetReference` (optional): The code of the asset, if applicable.
 *   - `mode` (optional): The mode of the transaction, e.g., "changetrust" or "send".
 *   - `fees` (optional): The fees associated with the transaction.
 *   - `memoType` (optional): The type of memo to attach to the transaction.
 *   - `memoValue` (optional): The value of the memo to attach to the transaction.
 * @param computeIntentType - An optional function to compute the intent type that supersedes the default implementation if present
 *
 * @returns A `TransactionIntent` object containing the standardized representation of the transaction.
 *   - Includes details such as type, sender, recipient, amount, fees, asset, and an optional memo.
 *   - If `assetReference` and `assetOwner` are provided, the asset is represented as a token.
 *   - If `memoType` and `memoValue` are provided, a memo is included; otherwise, a default memo of type "NO_MEMO" is added.
 *
 * @throws An error if the transaction mode is unsupported.
 */
export function transactionToIntent(
  account: Account,
  transaction: GenericTransaction,
  computeIntentType?: (transaction: GenericTransaction) => string,
): TransactionIntent & { memo?: { type: string; value?: string } } & {
  data?: { type: string; value?: unknown };
} {
  const intentType = (computeIntentType ?? defaultComputeIntentType)(transaction);
  const isStaking = ["stake", "unstake"].includes(intentType);
  const amount = isStaking ? 0n : fromBigNumberToBigInt(transaction.amount, 0n);
  const useAllAmount = isStaking || !!transaction.useAllAmount;
  const res: TransactionIntent & { memo?: { type: string; value?: string } } & {
    data?: { type: string; value?: unknown };
  } = {
    intentType: isStaking ? "staking" : "transaction",
    type: intentType,
    sender: account.freshAddress,
    recipient: transaction.recipient,
    amount,
    asset: { type: "native", name: account.currency.name, unit: account.currency.units[0] },
    useAllAmount,
    feesStrategy: transaction.feesStrategy ?? undefined,
    data: Buffer.isBuffer(transaction.data)
      ? { type: "buffer", value: transaction.data }
      : { type: "none" },
  };
  if (transaction.assetReference && transaction.assetOwner) {
    const { subAccountId } = transaction;
    const { subAccounts } = account;

    const tokenAccount = subAccountId ? subAccounts?.find(ta => ta.id === subAccountId) : null;

    res.asset = {
      type: tokenAccount?.token.tokenType ?? "token",
      assetReference: transaction.assetReference,
      name: tokenAccount?.token.name ?? transaction.assetReference, // NOTE: for stellar, assetReference = tokenAccount.name, this is futureproofing
      unit: account.currency.units[0],
      assetOwner: transaction.assetOwner,
    };
  }
  if (transaction.memoType && transaction.memoValue) {
    res.memo = {
      type: transaction.memoType,
      value: transaction.memoValue,
    };
  } else {
    res.memo = { type: "NO_MEMO" };
  }

  return res;
}

export const buildOptimisticOperation = (
  account: Account,
  transaction: GenericTransaction,
  sequenceNumber?: number,
): Operation => {
  let type: OperationType;
  switch (transaction.mode) {
    case "changeTrust":
      type = "OPT_IN";
      break;
    case "delegate":
    case "stake":
      type = "DELEGATE";
      break;
    case "undelegate":
    case "unstake":
      type = "UNDELEGATE";
      break;
    default:
      type = "OUT";
      break;
  }
  const fees = BigInt(transaction.fees?.toString() || "0");
  const { subAccountId } = transaction;
  const { subAccounts } = account;
  const parentType = subAccountId ? "FEES" : type;

  const operation: Operation = {
    id: encodeOperationId(account.id, "", parentType),
    hash: "",
    type: parentType,
    value: subAccountId ? new BigNumber(fees.toString()) : transaction.amount, // match old behavior
    fee: new BigNumber(fees.toString()),
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress.toString()],
    recipients: [transaction.recipient],
    transactionSequenceNumber: sequenceNumber ?? 0,
    accountId: account.id,
    date: new Date(),
    extra: {
      ledgerOpType: type,
      blockTime: new Date(),
      index: "0",
    },
  };

  const tokenAccount = subAccountId ? subAccounts?.find(ta => ta.id === subAccountId) : null;
  if (tokenAccount && subAccountId) {
    operation.subOperations = [
      {
        id: `${subAccountId}--${type}`,
        hash: "",
        type,
        value: transaction.useAllAmount ? tokenAccount.balance : transaction.amount,
        fee: new BigNumber(0),
        blockHash: null,
        blockHeight: null,
        senders: [account.freshAddress],
        recipients: [transaction.recipient],
        accountId: subAccountId,
        date: new Date(),
        extra: {
          ledgerOpType: type,
        },
      },
    ];
  }
  return operation;
};
