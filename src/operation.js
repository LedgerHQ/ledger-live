/**
 * @flow
 * @module account
 */

import { BigNumber } from "bignumber.js";
import type { Operation } from "./types";

export function getOperationAmountNumber(op: Operation): BigNumber {
  switch (op.type) {
    case "IN":
      return op.value;
    case "OUT":
      return op.value.negated();
    default:
      return BigNumber(0);
  }
}
