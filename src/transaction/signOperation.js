// @flow

import type {
  SignOperationEventRaw,
  SignOperationEvent,
  SignedOperationRaw,
  SignedOperation
} from "../types/transaction";

import { fromOperationRaw, toOperationRaw } from "../account";

export const fromSignedOperationRaw = (
  e: SignedOperationRaw,
  accountId: string
): SignedOperation => ({
  operation: fromOperationRaw(e.operation, accountId),
  signature: e.signature,
  expirationDate: e.expirationDate ? new Date(e.expirationDate) : null
});

export const toSignedOperationRaw = (
  e: SignedOperation,
  preserveSubOperation?: boolean
): SignedOperationRaw => ({
  operation: toOperationRaw(e.operation, preserveSubOperation),
  signature: e.signature,
  expirationDate: e.expirationDate ? e.expirationDate.toISOString() : null
});

export const fromSignOperationEventRaw = (
  e: SignOperationEventRaw,
  accountId: string
): SignOperationEvent => {
  switch (e.type) {
    case "signed":
      return {
        type: "signed",
        signedOperation: fromSignedOperationRaw(e.signedOperation, accountId)
      };
    default:
      return e;
  }
};

export const toSignOperationEventRaw = (
  e: SignOperationEvent
): SignOperationEventRaw => {
  switch (e.type) {
    case "signed":
      return {
        type: "signed",
        signedOperation: toSignedOperationRaw(e.signedOperation, true)
      };
    default:
      return e;
  }
};
