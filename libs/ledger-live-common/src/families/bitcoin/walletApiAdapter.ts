import { BitcoinTransaction as WalletAPIBitcoinTransaction } from "@ledgerhq/wallet-api-core";
import {
  AreFeesProvided,
  ConvertToLiveTransaction,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";
import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const areFeesProvided: AreFeesProvided<WalletAPIBitcoinTransaction> = (tx) =>
  !!tx.feePerByte;

const convertToLiveTransaction: ConvertToLiveTransaction<
  WalletAPIBitcoinTransaction,
  Transaction
> = ({ tx }) => {
  const hasFeesProvided = areFeesProvided(tx);

  const liveTx: Partial<Transaction> = {
    ...tx,
    amount: tx.amount,
    recipient: tx.recipient,
    feePerByte: tx.feePerByte,
  };

  return hasFeesProvided ? { ...liveTx, feesStrategy: null } : liveTx;
};

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPIBitcoinTransaction,
  Transaction
> = (params) => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: convertToLiveTransaction(params),
    hasFeesProvided: areFeesProvided(params.tx),
  };
};

export default { getWalletAPITransactionSignFlowInfos };
