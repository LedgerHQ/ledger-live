import BigNumber from "bignumber.js";
import { CASPER_FEES } from "../../consts";

export function getEstimatedFees(): BigNumber {
  return new BigNumber(CASPER_FEES);
}
