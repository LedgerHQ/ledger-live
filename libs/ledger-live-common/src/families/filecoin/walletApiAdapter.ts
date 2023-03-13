import { FilecoinTransaction as WalletAPIFilecoinTransaction } from "@ledgerhq/wallet-api-core";
import {
  AreFeesProvided,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";
import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const areFeesProvided: AreFeesProvided<WalletAPIFilecoinTransaction> = (tx) =>
  !!(tx.gasLimit && tx.gasFeeCap);

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPIFilecoinTransaction,
  Transaction
> = (tx: WalletAPIFilecoinTransaction) => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: tx,
    hasFeesProvided: areFeesProvided(tx),
  };
};

export default { getWalletAPITransactionSignFlowInfos };
