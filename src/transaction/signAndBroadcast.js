// @flow

import type {
  SignAndBroadcastEventRaw,
  SignAndBroadcastEvent
} from "../types/transaction";

import { fromOperationRaw, toOperationRaw } from "../account";

export const fromSignAndBroadcastEventRaw = (
  e: SignAndBroadcastEventRaw,
  accountId: string
): SignAndBroadcastEvent => {
  switch (e.type) {
    case "broadcasted":
      return {
        type: "broadcasted",
        operation: fromOperationRaw(e.operation, accountId)
      };
    default:
      return e;
  }
};

export const toSignAndBroadcastEventRaw = (
  e: SignAndBroadcastEvent
): SignAndBroadcastEventRaw => {
  switch (e.type) {
    case "broadcasted":
      return {
        type: "broadcasted",
        operation: toOperationRaw(e.operation)
      };
    default:
      return e;
  }
};
