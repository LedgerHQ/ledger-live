import { CosmosTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import {
  AreFeesProvided,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";
import { Transaction } from "./types";

const CAN_EDIT_FEES = true;

const areFeesProvided: AreFeesProvided<WalletAPITransaction> = (tx) =>
  !!tx.fees;

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPITransaction,
  Transaction
> = (tx) => ({
  canEditFees: CAN_EDIT_FEES,
  liveTx: tx,
  hasFeesProvided: areFeesProvided(tx),
});

export default { getWalletAPITransactionSignFlowInfos };
