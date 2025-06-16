import { OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import type { SuiOperationExtra, SuiOperationExtraRaw } from "../types";

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw) {
  if (extraRaw) {
    // reserved for future use
  }

  const extra: SuiOperationExtra = {};

  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra) {
  if (extra) {
    // reserved for future use
  }
  const extraRaw: SuiOperationExtraRaw = {};

  return extraRaw;
}

export default {
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
