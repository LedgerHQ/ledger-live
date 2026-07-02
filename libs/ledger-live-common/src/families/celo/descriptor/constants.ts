import { BigNumber } from "bignumber.js";

/** Wei ↔ Gwei conversion factor for Celo gas fee inputs. */
export const GWEI_DIVISOR = new BigNumber(10).pow(9);
