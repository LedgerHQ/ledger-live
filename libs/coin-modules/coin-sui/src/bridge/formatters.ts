import { OperationExtra, OperationExtraRaw } from "@ledgerhq/types-live";
import type { SuiOperationExtra, SuiOperationExtraRaw } from "../types";

export function fromOperationExtraRaw(extraRaw: OperationExtraRaw) {
  if (extraRaw) {
    //
  }

  const extra: SuiOperationExtra = {};

  return extra;
}

export function toOperationExtraRaw(extra: OperationExtra) {
  if (extra) {
    //
  }
  const extraRaw: SuiOperationExtraRaw = {};

  return extraRaw;
}

export default {
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
