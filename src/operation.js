/**
 * @flow
 * @module account
 */

import { BigNumber } from "bignumber.js";
import type { AccountLike, Operation } from "./types";

export function findOperationInAccount(
  { operations, pendingOperations }: AccountLike,
  operationId: string
): ?Operation {
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
  }
  for (let i = 0; i < pendingOperations.length; i++) {
    const op = pendingOperations[i];
    if (op.id === operationId) return op;
  }
  return null;
}

export function patchOperationWithHash(
  operation: Operation,
  hash: string
): Operation {
  return {
    ...operation,
    hash,
    id: `${operation.accountId}-${hash}-${operation.type}`,
    subOperations:
      operation.subOperations &&
      operation.subOperations.map(op => ({
        ...op,
        id: `${op.accountId}-${hash}-${op.type}`
      }))
  };
}

export function flattenOperationWithInternals(op: Operation): Operation[] {
  let ops = [];
  // ops of type NONE does not appear in lists
  if (op.type !== "NONE") {
    ops.push(op);
  }
  // all internal operations are expanded after the main op
  if (op.internalOperations) {
    ops = ops.concat(op.internalOperations);
  }
  return ops;
}

export function getOperationAmountNumber(op: Operation): BigNumber {
  switch (op.type) {
    case "IN":
    case "REWARD":
      return op.value;
    case "OUT":
    case "REVEAL":
    case "CREATE":
    case "DELEGATE":
    case "UNDELEGATE":
      return op.value.negated();
    case "FREEZE":
    case "UNFREEZE":
    case "VOTE":
      return op.fee.negated();
    default:
      return BigNumber(0);
  }
}

export function getOperationAmountNumberWithInternals(
  op: Operation
): BigNumber {
  return flattenOperationWithInternals(op).reduce(
    (amount: BigNumber, op) => amount.plus(getOperationAmountNumber(op)),
    BigNumber(0)
  );
}
