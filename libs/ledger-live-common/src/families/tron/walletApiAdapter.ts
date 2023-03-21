import { TronTransaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import { GetWalletAPITransactionSignFlowInfos } from "../../wallet-api/types";
import { Transaction } from "./types";

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPITransaction,
  Transaction
> = (tx) => ({
  canEditFees: false,
  liveTx: tx,
  hasFeesProvided: false,
});

export default { getWalletAPITransactionSignFlowInfos };
