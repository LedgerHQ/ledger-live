import type {
  SignOperationEventRaw,
  SignOperationEvent,
  SignedOperationRaw,
  SignedOperation,
} from "@ledgerhq/types-live";
import { fromOperationRaw, toOperationRaw } from "../account";
export const fromSignedOperationRaw = (
  signedOp: SignedOperationRaw,
  accountId: string
): SignedOperation => {
  const { operation, signature, expirationDate, signatureRaw } = signedOp;
  const out: SignedOperation = {
    operation: fromOperationRaw(operation, accountId),
    signature,
    expirationDate: expirationDate ? new Date(expirationDate) : null,
  };

  if (signatureRaw) {
    out.signatureRaw = signatureRaw;
  }

  return out;
};
export const toSignedOperationRaw = (
  signedOp: SignedOperation,
  preserveSubOperation?: boolean
): SignedOperationRaw => {
  const { operation, signature, expirationDate, signatureRaw } = signedOp;
  const out: SignedOperationRaw = {
    operation: toOperationRaw(operation, preserveSubOperation),
    signature,
    expirationDate: expirationDate ? expirationDate.toISOString() : null,
  };

  if (signatureRaw) {
    out.signatureRaw = signatureRaw;
  }

  return out;
};
export const fromSignOperationEventRaw = (
  e: SignOperationEventRaw,
  accountId: string
): SignOperationEvent => {
  switch (e.type) {
    case "signed":
      return {
        type: "signed",
        signedOperation: fromSignedOperationRaw(e.signedOperation, accountId),
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
        signedOperation: toSignedOperationRaw(e.signedOperation, true),
      };

    default:
      return e;
  }
};
