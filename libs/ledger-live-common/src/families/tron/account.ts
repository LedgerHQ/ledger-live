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

  if (extraRaw.unDelegatedAmount) {
    extra.unDelegatedAmount = new BigNumber(extraRaw.unDelegatedAmount);
  }

  if (extraRaw.receiverAddress) {
    extra.receiverAddress = extraRaw.receiverAddress;
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

  if (extra.unDelegatedAmount) {
    extraRaw.unDelegatedAmount = extra.unDelegatedAmount.toString();
  }

  if (extra.receiverAddress) {
    extraRaw.receiverAddress = extra.receiverAddress;
  }

  return extraRaw;
}

export default {
  fromOperationExtraRaw,
  toOperationExtraRaw,
};
