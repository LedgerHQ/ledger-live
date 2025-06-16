import BigNumber from "bignumber.js";
import { ICP_FEES } from "../../consts";

export function getEstimatedFees(): BigNumber {
  return new BigNumber(ICP_FEES);
}
