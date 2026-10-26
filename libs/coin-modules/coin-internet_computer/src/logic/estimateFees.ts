import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/index";
import { TRANSFER_FEE } from "../consts";

export function estimateFees(): FeeEstimation {
  return { value: TRANSFER_FEE };
}
