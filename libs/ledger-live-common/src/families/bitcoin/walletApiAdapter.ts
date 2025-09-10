import { BitcoinTransaction as WalletAPIBitcoinTransaction } from "@ledgerhq/wallet-api-core";
import {
  AreFeesProvided,
  ConvertToLiveTransaction,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";
import createTransaction from "@ledgerhq/coin-bitcoin/createTransaction";
import { Transaction } from "@ledgerhq/coin-bitcoin/types";
import { PsbtV2 } from "@ledgerhq/hw-app-btc/newops/psbtv2";

const CAN_EDIT_FEES = true;

const areFeesProvided: AreFeesProvided<WalletAPIBitcoinTransaction> = tx => !!tx.feePerByte;

const convertToLiveTransaction: ConvertToLiveTransaction<
  WalletAPIBitcoinTransaction,
  Transaction
> = ({ account, walletApiTransaction }) => {
  const hasFeesProvided = areFeesProvided(walletApiTransaction);

  const liveTx: Transaction = createTransaction(account);

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

  if (walletApiTransaction.psbt) {
    liveTx.psbt = walletApiTransaction.psbt;
  }

  if (hasFeesProvided) {
    liveTx.feesStrategy = null;
  }

  if (walletApiTransaction.psbt) {
    const psbtBuffer = Buffer.from(walletApiTransaction.psbt, "base64");
    const psbt = new PsbtV2();
    psbt.deserialize(psbtBuffer);
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
