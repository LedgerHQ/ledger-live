import { SolanaTransaction as WalletAPISolanaTransaction } from "@ledgerhq/wallet-api-core";
import {
  ConvertToLiveTransaction,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";
import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const convertToLiveTransaction: ConvertToLiveTransaction<
  WalletAPISolanaTransaction,
  Transaction
> = (tx) => ({
  ...tx,
  amount: tx.amount,
  recipient: tx.recipient,
});

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPISolanaTransaction,
  Transaction
> = (tx) => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: convertToLiveTransaction(tx),
    hasFeesProvided: false,
  };
};

export default { getWalletAPITransactionSignFlowInfos };
