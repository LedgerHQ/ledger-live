import BigNumber from "bignumber.js";
import { CASPER_FEES_MOTES } from "../../consts";

export function getEstimatedFees(): BigNumber {
  return new BigNumber(CASPER_FEES_MOTES);
}
