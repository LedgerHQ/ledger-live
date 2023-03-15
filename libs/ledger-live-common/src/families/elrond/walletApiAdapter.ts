import { ElrondTransaction as WalletAPIElrondTransaction } from "@ledgerhq/wallet-api-core";
import {
  ConvertToLiveTransaction,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";
import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const convertToLiveTransaction: ConvertToLiveTransaction<
  WalletAPIElrondTransaction,
  Transaction
> = (tx) => {
  const { gasLimit, ...restTx } = tx;

  const liveTx: Partial<Transaction> = {
    ...restTx,
    amount: tx.amount,
    recipient: tx.recipient,
    userGasLimit: gasLimit,
  };

  return liveTx;
};

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPIElrondTransaction,
  Transaction
> = (tx) => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: convertToLiveTransaction(tx),
    hasFeesProvided: !!tx.fees,
  };
};

export default { getWalletAPITransactionSignFlowInfos };
