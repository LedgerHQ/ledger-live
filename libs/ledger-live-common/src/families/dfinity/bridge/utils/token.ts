import BigNumber from "bignumber.js";
import { ICP_FEES } from "../../consts";

export const getEstimatedFees = (): BigNumber => {
  return BigNumber(ICP_FEES);
};
