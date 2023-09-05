import type {
  SignOperationEventRaw,
  SignOperationEvent,
  SignedOperationRaw,
  SignedOperation,
} from "@ledgerhq/types-live";
import { fromOperationRaw, toOperationRaw } from "../account";
export const fromSignedOperationRaw = (
  signedOp: SignedOperationRaw,
  accountId: string,
): SignedOperation => {
  const { operation, signature, expirationDate, rawData } = signedOp;
  const out: SignedOperation = {
    operation: fromOperationRaw(operation, accountId),
    signature,
  };

  if (rawData) {
    out.rawData = rawData;
  }

  if (expirationDate) {
    out.expirationDate = new Date(expirationDate);
  }

  return out;
};
export const toSignedOperationRaw = (
  signedOp: SignedOperation,
  preserveSubOperation?: boolean,
): SignedOperationRaw => {
  const { operation, signature, expirationDate, rawData } = signedOp;
  const out: SignedOperationRaw = {
    operation: toOperationRaw(operation, preserveSubOperation),
    signature,
  };

  if (rawData) {
    out.rawData = rawData;
  }

  if (expirationDate) {
    out.expirationDate = expirationDate.toISOString();
  }

  return out;
};
export const fromSignOperationEventRaw = (
  e: SignOperationEventRaw,
  accountId: string,
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
export const toSignOperationEventRaw = (e: SignOperationEvent): SignOperationEventRaw => {
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
