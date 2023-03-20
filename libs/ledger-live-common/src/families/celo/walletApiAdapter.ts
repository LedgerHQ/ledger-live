import { CeloTransaction as WalletAPICeloTransaction } from "@ledgerhq/wallet-api-core";
import {
  AreFeesProvided,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";
import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const areFeesProvided: AreFeesProvided<WalletAPICeloTransaction> = (tx) =>
  !!tx.fees;

const getWalletAPITransactionSignFlowInfo: GetWalletAPITransactionSignFlowInfos<
  WalletAPICeloTransaction,
  Transaction
> = (tx) => {
  return {
    canEditFees: CAN_EDIT_FEES,
    liveTx: tx,
    hasFeesProvided: areFeesProvided(tx),
  };
};

export default { getWalletAPITransactionSignFlowInfo };
