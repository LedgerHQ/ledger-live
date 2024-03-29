/**
 * This directory is about pure coin logic.
 * Its goal is to be as much as possible versatile code,
 * and therefore can be used with "any Ledger product"
 */

export { craftTransaction, type CreateExtrinsicArg } from "./craftTransaction";
export { signExtrinsic } from "./signTransaction";

import broadcast from "./broadcast";
import estimatedFees from "./estimatedFees";

export { broadcast, estimatedFees };
