import type { BitcoinTransaction as WalletAPIBitcoinTransaction } from "@ledgerhq/wallet-api-core";
import type {
  AreFeesProvided,
  ConvertToLiveTransaction,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";
import { createTransaction } from "../../bridge/generic-coin-framework/createTransaction";
import type { BitcoinFamilySpecificData, Transaction } from "./types";

const CAN_EDIT_FEES = true;

const areFeesProvided: AreFeesProvided<WalletAPIBitcoinTransaction> = tx => !!tx.feePerByte;

/**
 * Wallet API transactions carry the bitcoin fields at the top level; on the generic coin framework
 * they live in `familySpecificData` (ADR-065 D15).
 */
const convertToLiveTransaction: ConvertToLiveTransaction<
  WalletAPIBitcoinTransaction,
  Transaction
> = ({ account, walletApiTransaction }) => {
  const liveTx = createTransaction(account) as Transaction;
  const familySpecificData: BitcoinFamilySpecificData = {
    ...liveTx.familySpecificData,
    ...(walletApiTransaction.feePerByte
      ? { feePerByte: walletApiTransaction.feePerByte.toFixed() }
      : {}),
    ...(walletApiTransaction.opReturnData
      ? { opReturnData: walletApiTransaction.opReturnData.toString("hex") }
      : {}),
    ...(walletApiTransaction.changeAddress
      ? { changeAddress: walletApiTransaction.changeAddress }
      : {}),
  };

  return {
    ...liveTx,
    ...(walletApiTransaction.amount ? { amount: walletApiTransaction.amount } : {}),
    ...(walletApiTransaction.recipient ? { recipient: walletApiTransaction.recipient } : {}),
    // the live app's rate applies as is, no preset
    ...(areFeesProvided(walletApiTransaction) ? { feesStrategy: null } : {}),
    familySpecificData,
  };
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
