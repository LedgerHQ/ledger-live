import { BigNumber } from "bignumber.js";
import { TrongridExtraTxInfo, TrongridExtraTxInfoRaw } from "./types";

export function fromOperationExtraRaw(extraRaw: TrongridExtraTxInfoRaw): TrongridExtraTxInfo {
  const extra: TrongridExtraTxInfo = {};

  if (extraRaw.frozenAmount) {
    extra.frozenAmount = new BigNumber(extraRaw.frozenAmount);
  }

  if (extraRaw.unfreezeAmount) {
    extra.unfreezeAmount = new BigNumber(extraRaw.unfreezeAmount);
  }

  if (extraRaw.votes) {
    extra.votes = extraRaw.votes;
  }

  if (extraRaw.frozenV2Amount) {
    extra.frozenV2Amount = new BigNumber(extraRaw.frozenV2Amount);
  }

  return extra;
}

export function toOperationExtraRaw(extra: TrongridExtraTxInfo): TrongridExtraTxInfoRaw {
  const extraRaw: TrongridExtraTxInfoRaw = {};

  if (extra.frozenAmount) {
    extraRaw.frozenAmount = extra.frozenAmount.toString();
  }

  if (extra.unfreezeAmount) {
    extraRaw.unfreezeAmount = extra.unfreezeAmount.toString();
  }

  if (extra.votes) {
    extraRaw.votes = extra.votes;
  }

  if (extra.frozenV2Amount) {
    extraRaw.frozenV2Amount = extra.frozenV2Amount.toString();
  }

  return extraRaw;
}

export default {
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
