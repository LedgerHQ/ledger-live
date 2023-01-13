import type {
  Account,
  AccountLike,
  NFTStandard,
  Operation,
} from "@ledgerhq/types-live";
import { isEqual } from "lodash";
import { BigNumber } from "bignumber.js";
import { decodeAccountId } from "./account";
import { encodeNftId } from "./nft";
import {
  encodeERC1155OperationId,
  encodeERC721OperationId,
} from "./nft/nftOperationId";

const nftOperationIdEncoderPerStandard: Record<
  NFTStandard,
  (...args: any[]) => string
> = {
  ERC721: encodeERC721OperationId,
  ERC1155: encodeERC1155OperationId,
};

export function findOperationInAccount(
  { operations, pendingOperations }: AccountLike,
  operationId: string
): Operation | null | undefined {
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (op.id === operationId) return op;

    if (op.internalOperations) {
      const internalOps = op.internalOperations;

      for (let j = 0; j < internalOps.length; j++) {
        const internalOp = internalOps[j];
        if (internalOp.id === operationId) return internalOp;
      }
    }

    if (op.nftOperations) {
      const nftOps = op.nftOperations;

      for (let j = 0; j < nftOps.length; j++) {
        const nftOp = nftOps[j];

        if (nftOp.id === operationId) return nftOp;
      }
    }
  }

  for (let i = 0; i < pendingOperations.length; i++) {
    const op = pendingOperations[i];
    if (op.id === operationId) return op;

    if (op.nftOperations) {
      const nftOps = op.nftOperations;

      for (let j = 0; j < nftOps.length; j++) {
        const nftOp = nftOps[j];

        if (nftOp.id === operationId) return nftOp;
      }
    }
  }

  return null;
}

export function encodeOperationId(
  accountId: string,
  hash: string,
  type: string
): string {
  return `${accountId}-${hash}-${type}`;
}

export function decodeOperationId(id: string): {
  accountId: string;
  hash: string;
  type: string;
} {
  const [accountId, hash, type] = id.split("-");
  return {
    accountId,
    hash,
    type,
  };
}

export function encodeSubOperationId(
  accountId: string,
  hash: string,
  type: string,
  index: string | number
): string {
  return `${accountId}-${hash}-${type}-i${index}`;
}

export function decodeSubOperationId(id: string): {
  accountId: string;
  hash: string;
  type: string;
  index: number;
} {
  const [accountId, hash, type, index] = id.split("-");
  return {
    accountId,
    hash,
    type,
    index: Number(index),
  };
}

export function patchOperationWithHash(
  operation: Operation,
  hash: string
): Operation {
  return {
    ...operation,
    hash,
    id: encodeOperationId(operation.accountId, hash, operation.type),
    subOperations:
      operation.subOperations &&
      operation.subOperations.map((op) => ({
        ...op,
        hash,
        id: encodeOperationId(op.accountId, hash, op.type),
      })),
    nftOperations:
      operation.nftOperations &&
      operation.nftOperations.map((nftOp, i) => {
        const { currencyId } = decodeAccountId(operation.accountId);
        const nftId = encodeNftId(
          operation.accountId,
          nftOp.contract || "",
          nftOp.tokenId || "",
          currencyId
        );
        const nftOperationIdEncoder =
          nftOperationIdEncoderPerStandard[nftOp?.standard || ""] ||
          nftOperationIdEncoderPerStandard.ERC721;

        return {
          ...nftOp,
          hash,
          id: nftOperationIdEncoder(nftId, hash, nftOp.type, 0, i),
        };
      }),
  };
}

export function flattenOperationWithInternalsAndNfts(
  op: Operation
): Operation[] {
  let ops: Operation[] = [];

  // ops of type NONE does not appear in lists
  if (op.type !== "NONE") {
    ops.push(op);
  }

  // all internal operations are expanded after the main op
  if (op.internalOperations) {
    ops = ops.concat(op.internalOperations);
  }

  // all nfts operations are expanded after the main op
  if (op.nftOperations) {
    ops = ops.concat(op.nftOperations);
  }

  return ops;
}

export function getOperationAmountNumber(op: Operation): BigNumber {
  switch (op.type) {
    case "IN":
    case "REWARD":
    case "REWARD_PAYOUT":
    case "SUPPLY":
    case "WITHDRAW":
      return op.value;

    case "OUT":
    case "REVEAL":
    case "CREATE":
    case "FEES":
    case "DELEGATE":
    case "REDELEGATE":
    case "UNDELEGATE":
    case "OPT_IN":
    case "OPT_OUT":
    case "REDEEM":
    case "SLASH":
    case "LOCK":
      return op.value.negated();

    case "FREEZE":
    case "UNFREEZE":
    case "VOTE":
    case "BOND":
    case "UNBOND":
    case "WITHDRAW_UNBONDED":
    case "SET_CONTROLLER":
    case "NOMINATE":
    case "CHILL":
    case "REVOKE":
    case "APPROVE":
    case "ACTIVATE":
    case "UNLOCK":
    case "STAKE":
    case "UNSTAKE":
    case "WITHDRAW_UNSTAKED":
      return op.fee.negated();

    default:
      return new BigNumber(0);
  }
}

export function getOperationAmountNumberWithInternals(
  op: Operation
): BigNumber {
  return flattenOperationWithInternalsAndNfts(op).reduce(
    (amount: BigNumber, op) => amount.plus(getOperationAmountNumber(op)),
    new BigNumber(0)
  );
}

export const getOperationConfirmationNumber = (
  operation: Operation,
  account: Account
): number =>
  operation.blockHeight ? account.blockHeight - operation.blockHeight + 1 : 0;

export const getOperationConfirmationDisplayableNumber = (
  operation: Operation,
  account: Account
): string =>
  account.blockHeight && operation.blockHeight && account.currency.blockAvgTime
    ? String(account.blockHeight - operation.blockHeight + 1)
    : "";

export const isConfirmedOperation = (
  operation: Operation,
  account: Account,
  confirmationsNb: number
): boolean =>
  operation.blockHeight
    ? account.blockHeight - operation.blockHeight + 1 >= confirmationsNb
    : false;

/**
 * @FIXME @FIXME @FIXME
 * THE FOLLOWING CODE IS DUPLICATED FROM jsHelpers.ts WHICH HAS A CIRCULAR DEPENDECY
 * EVERY USE OF mergeOps & sameOp SHOULD BE MIGRATED TO THIS ONE TO TEMPORARLY FIX THE ISSUE
 */

// compare that two dates are roughly the same date in order to update the case it would have drastically changed
const sameDate = (a, b) => Math.abs(a - b) < 1000 * 60 * 30;

// an operation is relatively immutable, however we saw that sometimes it can temporarily change due to reorg,..
export const sameOp = (a: Operation, b: Operation): boolean =>
  a === b ||
  (a.id === b.id && // hash, accountId, type are in id
    (a.fee ? a.fee.isEqualTo(b.fee) : a.fee === b.fee) &&
    (a.value ? a.value.isEqualTo(b.value) : a.value === b.value) &&
    a.nftOperations?.length === b.nftOperations?.length &&
    sameDate(a.date, b.date) &&
    a.blockHeight === b.blockHeight &&
    isEqual(a.senders, b.senders) &&
    isEqual(a.recipients, b.recipients));
// efficiently prepend newFetched operations to existing operations

export function mergeOps( // existing operations. sorted (newer to older). deduped.
  existing: Operation[], // new fetched operations. not sorted. not deduped. time is allowed to overlap inside existing.
  newFetched: Operation[]
): // return a list of operations, deduped and sorted from newer to older
Operation[] {
  // there is new fetched
  if (newFetched.length === 0) return existing;
  // efficient lookup map of id.
  const existingIds = {};

  for (const o of existing) {
    existingIds[o.id] = o;
  }

  // only keep the newFetched that are not in existing. this array will be mutated
  let newOps = newFetched
    .filter((o) => !existingIds[o.id] || !sameOp(existingIds[o.id], o))
    .sort((a, b) => b.date.valueOf() - a.date.valueOf());

  // Deduplicate new ops to guarantee operations don't have dups
  const newOpsIds = {};
  newOps.forEach((op) => {
    newOpsIds[op.id] = op;
  });
  newOps = Object.values(newOpsIds);

  // return existing when there is no real new operations
  if (newOps.length === 0) return existing;
  // edge case, existing can be empty. return the sorted list.
  if (existing.length === 0) return newOps;
  // building up merging the ops
  const all: Operation[] = [];

  for (const o of existing) {
    // prepend all the new ops that have higher date
    while (newOps.length > 0 && newOps[0].date >= o.date) {
      all.push(newOps.shift() as Operation);
    }

    if (!newOpsIds[o.id]) {
      all.push(o);
    }
  }

  return all;
}
