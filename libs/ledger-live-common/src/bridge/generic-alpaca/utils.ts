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
import {
  FeeData,
  FeeDataRaw,
  GasOptions,
  GasOptionsRaw,
  GenericTransaction,
  GenericTransactionRaw,
  OperationCommon,
} from "./types";

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
  const hasFailed = op.details?.status === "failed";

  let value: BigNumber;
  if (hasFailed) {
    value = bnFees;
  } else if (
    op.asset.type === "native" &&
    ["OUT", "FEES", "DELEGATE", "UNDELEGATE"].includes(opType)
  ) {
    value = new BigNumber(op.value.toString()).plus(bnFees);
  } else {
    value = new BigNumber(op.value.toString());
  }

  const res = {
    id: encodeOperationId(accountId, op.tx.hash, op.type),
    hash: op.tx.hash,
    accountId,
    type: opType,
    value,
    fee: bnFees,
    blockHash: op.tx.block.hash,
    blockHeight: op.tx.block.height,
    senders: extra.parentSenders ?? op.senders,
    recipients: extra.parentRecipients ?? op.recipients,
    date: op.tx.date,
    transactionSequenceNumber: op.details?.sequence
      ? new BigNumber(op.details?.sequence.toString())
      : undefined,
    hasFailed,
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
    sequence:
      transaction.nonce !== null && transaction.nonce !== undefined
        ? BigInt(transaction.nonce.toString())
        : undefined,
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

function toFeeDataRaw(data: FeeData): FeeDataRaw {
  return {
    gasPrice: data.gasPrice?.toFixed() ?? null,
    maxFeePerGas: data.maxFeePerGas?.toFixed() ?? null,
    maxPriorityFeePerGas: data.maxPriorityFeePerGas?.toFixed() ?? null,
    nextBaseFee: data.nextBaseFee?.toFixed() ?? null,
  };
}

function toGasOptionRaw(options: GasOptions): GasOptionsRaw {
  return {
    fast: toFeeDataRaw(options.fast),
    medium: toFeeDataRaw(options.medium),
    slow: toFeeDataRaw(options.slow),
  };
}

function toGenericTransactionRaw(transaction: GenericTransaction): GenericTransactionRaw {
  const raw: GenericTransactionRaw = {
    amount: transaction.amount.toString(),
    recipient: transaction.recipient,
    family: transaction.family,
  };

  if ("useAllAmount" in transaction) {
    raw.useAllAmount = transaction.useAllAmount;
  }

  const stringFieldsToPropagate = [
    "memoType",
    "memoValue",
    "assetReference",
    "assetOwner",
  ] as const;
  for (const field of stringFieldsToPropagate) {
    if (field in transaction) {
      raw[field] = transaction[field];
    }
  }

  const numberFieldsToPropagate = ["tag", "type", "chainId"] as const;
  for (const field of numberFieldsToPropagate) {
    if (field in transaction) {
      raw[field] = transaction[field];
    }
  }

  const bigNumberFieldsToPropagate = [
    "fees",
    "storageLimit",
    "nonce",
    "gasLimit",
    "gasPrice",
    "maxFeePerGas",
    "maxPriorityFeePerGas",
  ] as const;
  for (const field of bigNumberFieldsToPropagate) {
    if (field in transaction) {
      raw[field] = transaction[field]?.toFixed();
    }
  }

  if ("customFees" in transaction) {
    raw.customFees =
      transaction.customFees && "fees" in transaction.customFees.parameters
        ? {
            parameters: { fees: transaction.customFees.parameters.fees?.toFixed() },
          }
        : { parameters: {} };
  }

  if ("feesStrategy" in transaction) {
    raw.feesStrategy = transaction.feesStrategy;
  }

  if ("mode" in transaction) {
    raw.mode = transaction.mode;
  }

  if ("feeCustomUnit" in transaction) {
    raw.feeCustomUnit = transaction.feeCustomUnit;
  }

  if ("data" in transaction) {
    raw.data = transaction.data?.toString("hex");
  }

  if ("networkInfo" in transaction) {
    raw.networkInfo = transaction.networkInfo && {
      fees: transaction.networkInfo.fees.toFixed(),
    };
  }

  if ("gasOptions" in transaction) {
    raw.gasOptions = transaction.gasOptions && toGasOptionRaw(transaction.gasOptions);
  }

  return raw;
}

export const buildOptimisticOperation = (
  account: Account,
  transaction: GenericTransaction,
  sequenceNumber?: bigint,
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
  const tokenAccount = subAccountId ? subAccounts?.find(ta => ta.id === subAccountId) : null;

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
    transactionSequenceNumber: new BigNumber(sequenceNumber?.toString() ?? 0),
    accountId: account.id,
    date: new Date(),
    transactionRaw: toGenericTransactionRaw({
      ...transaction,
      nonce: sequenceNumber !== undefined ? new BigNumber(sequenceNumber.toString()) : undefined,
      ...(tokenAccount
        ? { recipient: tokenAccount.token.contractAddress, amount: new BigNumber(0) }
        : {}),
    }),
    extra: {
      ledgerOpType: type,
      blockTime: new Date(),
      index: "0",
    },
  };

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
        transactionRaw: toGenericTransactionRaw({
          ...transaction,
          nonce:
            sequenceNumber !== undefined ? new BigNumber(sequenceNumber.toString()) : undefined,
        }),
        extra: {
          ledgerOpType: type,
        },
      },
    ];
  }
  return operation;
};
