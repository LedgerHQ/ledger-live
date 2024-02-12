import { BigNumber } from "bignumber.js";
import { CASPER_MAX_TRANSFER_ID } from "../../consts";

export function isTransferIdValid(id?: string): boolean {
  if (!id || !id.length) return true;
  if (/^\d+$/.test(id) && new BigNumber(id).lt(new BigNumber(CASPER_MAX_TRANSFER_ID))) return true;

  return false;
}
