/**
 * This directory is about pure coin logic.
 * Its goal is to be as much as possible versatile code,
 * and therefore can be used with "any Ledger product"
 */

export { createTransaction } from "./transaction";
export {
  calculateAmount,
  canBond,
  canUnbond,
  canNominate,
  getMinimumBalance,
  getNonce,
  hasExternalController,
  hasExternalStash,
  hasMinimumBondBalance,
  hasPendingOperationType,
  isElectionOpen,
  isStash,
  isFirstBond,
  MAX_NOMINATIONS,
} from "./utils";
export { getAccountShape } from "./synchronisation";
export {
  getCurrentPolkadotPreloadData,
  setPolkadotPreloadData,
  getPolkadotPreloadDataUpdates,
} from "./state";
export { buildTransaction } from "./buildTransaction";
export { signExtrinsic } from "./signTransaction";

import broadcast from "./broadcast";
import estimateMaxSpendable from "./estimateMaxSpendable";
import getEstimatedFees from "./getFeesForTransaction";
import getTransactionStatus from "./getTransactionStatus";

export { broadcast, estimateMaxSpendable, getEstimatedFees, getTransactionStatus };
