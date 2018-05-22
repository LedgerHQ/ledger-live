/**
 * @flow
 * @module helpers/account
 */
import type { Operation } from "../types";

export function getOperationAmountNumber(op: Operation): number {
  switch (op.type) {
    case "IN":
      return op.value;
    case "OUT":
      return -op.value;
    default:
      return 0;
  }
}
