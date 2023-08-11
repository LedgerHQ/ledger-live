import { RippleTransaction as WalletAPIRippleTransaction } from "@ledgerhq/wallet-api-core";
import { AreFeesProvided, GetWalletAPITransactionSignFlowInfos } from "../../wallet-api/types";

import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const areFeesProvided: AreFeesProvided<WalletAPIRippleTransaction> = tx => !!tx.fee;

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPIRippleTransaction,
  Transaction
> = tx => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: tx,
    hasFeesProvided: areFeesProvided(tx),
  };
};

export default { getWalletAPITransactionSignFlowInfos };
