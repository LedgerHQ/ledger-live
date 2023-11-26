import { BitcoinTransaction as WalletAPIBitcoinTransaction } from "@ledgerhq/wallet-api-core";
import {
  AreFeesProvided,
  ConvertToLiveTransaction,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";
import createTransaction from "./js-createTransaction";
import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const areFeesProvided: AreFeesProvided<WalletAPIBitcoinTransaction> = tx => !!tx.feePerByte;

const convertToLiveTransaction: ConvertToLiveTransaction<
  WalletAPIBitcoinTransaction,
  Transaction
> = ({ walletApiTransaction }) => {
  const hasFeesProvided = areFeesProvided(walletApiTransaction);

  const liveTx: Transaction = createTransaction();

  if (walletApiTransaction.amount) {
    liveTx.amount = walletApiTransaction.amount;
  }

  if (walletApiTransaction.recipient) {
    liveTx.recipient = walletApiTransaction.recipient;
  }

  if (walletApiTransaction.feePerByte) {
    liveTx.feePerByte = walletApiTransaction.feePerByte;
  }

  if (walletApiTransaction.opReturnData) {
    liveTx.opReturnData = walletApiTransaction.opReturnData;
  }

  if (hasFeesProvided) {
    liveTx.feesStrategy = null;
  }

  return liveTx;
};

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPIBitcoinTransaction,
  Transaction
> = ({ walletApiTransaction, account }) => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: convertToLiveTransaction({ walletApiTransaction, account }),
    hasFeesProvided: areFeesProvided(walletApiTransaction),
  };
};

export default { getWalletAPITransactionSignFlowInfos };
