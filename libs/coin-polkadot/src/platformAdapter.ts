// TODO: to remove once live-app-sdk is depreciated and removed from LL

import { PolkadotTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
import { Transaction } from "./types";

const CAN_EDIT_FEES = false;

const convertToLiveTransaction = (
  tx: PlatformTransaction
): Partial<Transaction> => ({
  ...tx,
  era: tx.era ? `${tx.era}` : undefined,
});

const getPlatformTransactionSignFlowInfos = (
  tx: PlatformTransaction
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
