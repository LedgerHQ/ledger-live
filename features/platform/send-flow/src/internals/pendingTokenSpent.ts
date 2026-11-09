import BigNumber from "bignumber.js";
import type { SendOperation } from "../registry";

import { SEND_OUTGOING_OPERATION_TYPES } from "../operations/outgoingOperationTypes";

/** Token balance committed by pending outgoing operations; fees are paid in the native currency. */
export function getPendingTokenSpent(pendingOperations: readonly SendOperation[]): BigNumber {
  return pendingOperations.reduce(
    (spent, op) => (SEND_OUTGOING_OPERATION_TYPES.has(op.type) ? spent.plus(op.value) : spent),
    new BigNumber(0),
  );
}
