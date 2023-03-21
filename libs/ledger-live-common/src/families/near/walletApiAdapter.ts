import { NearTransaction as WalletAPINearTransaction } from "@ledgerhq/wallet-api-core";
import {
  AreFeesProvided,
  GetWalletAPITransactionSignFlowInfos,
} from "../../wallet-api/types";

import { Transaction } from "./types";

const areFeesProvided: AreFeesProvided<WalletAPINearTransaction> = (tx) =>
  !!tx.fees;

const getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<
  WalletAPINearTransaction,
  Transaction
> = (tx) => ({
  canEditFees: true,
  liveTx: tx,
  hasFeesProvided: areFeesProvided(tx),
});

export default { getWalletAPITransactionSignFlowInfos };
