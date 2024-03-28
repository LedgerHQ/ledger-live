/**
 * This directory is about pure coin logic.
 * Its goal is to be as much as possible versatile code,
 * and therefore can be used with "any Ledger product"
 */

export { getAccountShape } from "./synchronisation";
export { craftTransaction } from "./buildTransaction";
export type { CreateExtrinsicArg } from "./buildTransaction";
export { signExtrinsic } from "./signTransaction";

import broadcast from "./broadcast";
import estimatedFees from "./estimatedFees";

export { broadcast, estimatedFees };
