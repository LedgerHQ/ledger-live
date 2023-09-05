import { BigNumber } from "bignumber.js";
import { CeloOperationExtra, CeloOperationExtraRaw } from "./types";

export function fromOperationExtraRaw(extraRaw: CeloOperationExtraRaw): CeloOperationExtra {
  const extra: CeloOperationExtra = {
    celoOperationValue: new BigNumber(extraRaw.celoOperationValue),
  };

  if (extraRaw.celoSourceValidator) {
    extra.celoSourceValidator = extraRaw.celoSourceValidator;
  }

  return extra;
}

export function toOperationExtraRaw(extra: CeloOperationExtra): CeloOperationExtraRaw {
  const extraRaw: CeloOperationExtraRaw = {
    celoOperationValue: extra.celoOperationValue.toString(),
  };

  if (extra.celoSourceValidator) {
    extraRaw.celoSourceValidator = extra.celoSourceValidator;
  }

  return extraRaw;
}

export default {
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
