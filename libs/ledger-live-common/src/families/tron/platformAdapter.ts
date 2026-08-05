// TODO: to remove once live-app-sdk is depreciated and removed from LL

import { TronTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
import type { Transaction, TronFamilySpecificData } from "./types";

// Tron fees are chain-computed and not editable — see `walletApiAdapter.ts`, which does the same for
// the wallet API.
const CAN_EDIT_FEES = false;

/**
 * Moves `resource` and `duration` off the top level and into `familySpecificData`, where
 * `bridge/api.ts:buildIntentData` reads them. The legacy SDK models no votes, so a vote arriving on
 * this path carries none.
 */
const convertToLiveTransaction = (tx: PlatformTransaction): Partial<Transaction> => {
  const { resource, duration, ...common } = tx;
  const familySpecificData: TronFamilySpecificData = {
    ...(resource !== undefined ? { resource } : {}),
    ...(duration !== undefined ? { duration } : {}),
  };

  return {
    ...common,
    family: "tron",
    ...(Object.keys(familySpecificData).length > 0 ? { familySpecificData } : {}),
  };
};

const getPlatformTransactionSignFlowInfos = (
  tx: PlatformTransaction,
): {
  canEditFees: boolean;
  hasFeesProvided: boolean;
  liveTx: Partial<Transaction>;
} => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: convertToLiveTransaction(tx),
    hasFeesProvided: false,
  };
};

export default { getPlatformTransactionSignFlowInfos };
