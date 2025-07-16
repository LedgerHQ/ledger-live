/**
 * This directory is about pure coin logic.
 * Its goal is to be as much as possible versatile code,
 * and therefore can be used with "any Ledger product"
 */

export {
  craftTransaction,
  craftEstimationTransaction,
  defaultExtrinsicArg,
  rawEncode,
  type CreateExtrinsicArg,
} from "./craftTransaction";
export { signExtrinsic } from "./signTransaction";

export { broadcast } from "./broadcast";
export { getBalance } from "./getBalance";
export { estimateFees } from "./estimateFees";
export { lastBlock } from "./lastBlock";
export { listOperations } from "./listOperations";
