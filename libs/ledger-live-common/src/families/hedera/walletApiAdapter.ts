import { HederaTransaction as WalletAPIHederaTransaction } from "@ledgerhq/wallet-api-core";
import { GetWalletAPITransactionSignFlowInfos } from "../../wallet-api/types";
import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const getWalletAPITransactionSignFlowInfo: GetWalletAPITransactionSignFlowInfos<
  WalletAPIHederaTransaction,
  Transaction
> = (tx) => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: tx,
    hasFeesProvided: false,
  };
};

export default { getWalletAPITransactionSignFlowInfo };
