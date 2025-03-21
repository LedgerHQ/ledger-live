import { BigNumber } from "bignumber.js";

export const ONE_TRX = new BigNumber(1000000);
export const STANDARD_FEES_NATIVE = new BigNumber(2000);
export const ACTIVATION_FEES = ONE_TRX.multipliedBy(1.1); // ONE TRX fee + 0.1 TRX activation cost
export const ACTIVATION_FEES_TRC_20 = ONE_TRX.multipliedBy(27.6009);
export const STANDARD_FEES_TRC_20 = ONE_TRX.multipliedBy(13.7409);
