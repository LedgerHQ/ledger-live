// TODO: to remove once live-app-sdk is depreciated and removed from LL

import { RippleTransaction as PlatformTransaction } from "@ledgerhq/live-app-sdk";
import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const areFeesProvided = (tx: PlatformTransaction): boolean => !!tx.fee;

const convertToLiveTransaction = (tx: PlatformTransaction): Partial<Transaction> => {
  return tx;
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
    hasFeesProvided: areFeesProvided(tx),
  };
};

export default { getPlatformTransactionSignFlowInfos };
