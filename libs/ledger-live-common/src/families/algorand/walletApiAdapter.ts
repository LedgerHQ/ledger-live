import { AlgorandTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import {
  AreFeesProvided,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";
import { Transaction } from "./types";

const areFeesProvided: AreFeesProvided<WalletAPITransaction> = (tx) =>
  !!tx.fees;

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPITransaction,
  Transaction
> = (tx) => ({
  canEditFees: true,
  // TODO: Why AlgorandOperationMode is different (e.g. `optOut`)?
  liveTx: tx as Transaction,
  hasFeesProvided: areFeesProvided(tx),
});

export default { getWalletAPITransactionSignFlowInfos };
