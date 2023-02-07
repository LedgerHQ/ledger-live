import { BigNumber } from "bignumber.js";
import type {
  Operation,
  OperationRaw,
  SubAccount,
} from "@ledgerhq/types-live";

export type ExtractExtraFn = (extra: Record<string, any>) => Record<string, any>

export const toOperationRaw = (
  {
    date,
    value,
    fee,
    subOperations,
    internalOperations,
    nftOperations,
    extra,
    id,
    hash,
    type,
    senders,
    recipients,
    blockHeight,
    blockHash,
    transactionSequenceNumber,
    accountId,
    hasFailed,
    contract,
    operator,
    standard,
    tokenId,
    transactionRaw,
  }: Operation,
  extractExtra?: ExtractExtraFn,
  preserveSubOperation?: boolean
): OperationRaw => {
  let e = extra;

  if (extractExtra) {
    e = extractExtra(e)
  }

  const copy: OperationRaw = {
    id,
    hash,
    type,
    senders,
    recipients,
    accountId,
    blockHash,
    blockHeight,
    extra: e,
    date: date.toISOString(),
    value: value.toFixed(),
    fee: fee.toString(),
    contract,
    operator,
    standard,
    tokenId,
  };

  if (transactionSequenceNumber !== undefined) {
    copy.transactionSequenceNumber = transactionSequenceNumber;
  }

  if (hasFailed !== undefined) {
    copy.hasFailed = hasFailed;
  }

  if (subOperations && preserveSubOperation) {
    copy.subOperations = subOperations.map((o) => toOperationRaw(o, extractExtra));
  }

  if (internalOperations) {
    copy.internalOperations = internalOperations.map((o) => toOperationRaw(o, extractExtra));
  }

  if (nftOperations) {
    copy.nftOperations = nftOperations.map((o) => toOperationRaw(o, extractExtra));
  }

  if (transactionRaw !== undefined) {
    copy.transactionRaw = transactionRaw;
  }
  
  return copy;
};
export const inferSubOperations = (
  txHash: string,
  subAccounts: SubAccount[]
): Operation[] => {
  const all: Operation[] = [];

  for (let i = 0; i < subAccounts.length; i++) {
    const ta = subAccounts[i];

    for (let j = 0; j < ta.operations.length; j++) {
      const op = ta.operations[j];

      if (op.hash === txHash) {
        all.push(op);
      }
    }

    for (let j = 0; j < ta.pendingOperations.length; j++) {
      const op = ta.pendingOperations[j];

      if (op.hash === txHash) {
        all.push(op);
      }
    }
  }

  return all;
};
export const fromOperationRaw = (
  {
    date,
    value,
    fee,
    extra,
    subOperations,
    internalOperations,
    nftOperations,
    id,
    hash,
    type,
    senders,
    recipients,
    blockHeight,
    blockHash,
    transactionSequenceNumber,
    hasFailed,
    contract,
    operator,
    standard,
    tokenId,
    transactionRaw,
  }: OperationRaw,
  accountId: string,
  extractExtra?: ExtractExtraFn,
  subAccounts?: SubAccount[] | null | undefined
): Operation => {
  let e = extra;

  if (extractExtra) {
    e = extractExtra(e)
  }

  const res: Operation = {
    id,
    hash,
    type,
    senders,
    recipients,
    accountId,
    blockHash,
    blockHeight,
    date: new Date(date),
    value: new BigNumber(value),
    fee: new BigNumber(fee),
    extra: e || {},
    contract,
    operator,
    standard,
    tokenId,
  };

  if (transactionSequenceNumber !== undefined) {
    res.transactionSequenceNumber = transactionSequenceNumber;
  }

  if (hasFailed !== undefined) {
    res.hasFailed = hasFailed;
  }

  if (subAccounts) {
    res.subOperations = inferSubOperations(hash, subAccounts);
  } else if (subOperations) {
    res.subOperations = subOperations.map((o) =>
      fromOperationRaw(o, o.accountId, extractExtra)
    );
  }

  if (internalOperations) {
    res.internalOperations = internalOperations.map((o) =>
      fromOperationRaw(o, o.accountId, extractExtra)
    );
  }

  if (nftOperations) {
    res.nftOperations = nftOperations.map((o) =>
      fromOperationRaw(o, o.accountId, extractExtra)
    );
  }

  if (transactionRaw !== undefined) {
    res.transactionRaw = transactionRaw;
  }

  return res;
};
