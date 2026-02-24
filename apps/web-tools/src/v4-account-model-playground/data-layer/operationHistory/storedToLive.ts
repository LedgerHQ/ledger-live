/**
 * Deserialize StoredOperation → Operation (for reconstruction / top-level selectors).
 * Kept separate from actions.ts to avoid circular dependency with shared/compatibility.
 */
/* eslint-disable @typescript-eslint/consistent-type-assertions -- StoredOperation has required id/hash/type; spread narrows to optional */
import { BigNumber } from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import type { StoredOperation } from "./schema";

export function storedOperationToLive(stored: StoredOperation): Operation {
  return {
    ...stored,
    value: new BigNumber(stored.value),
    fee: new BigNumber(stored.fee),
    date: new Date(stored.date),
    transactionSequenceNumber:
      stored.transactionSequenceNumber != null
        ? new BigNumber(stored.transactionSequenceNumber)
        : undefined,
  } as Operation; // spread from StoredOperation narrows id/hash/type to optional
}
