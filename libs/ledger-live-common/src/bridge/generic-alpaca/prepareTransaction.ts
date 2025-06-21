import { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";

export function genericPrepareTransaction(
  network,
  kind,
): AccountBridge<TransactionCommon, Account, any, any>["prepareTransaction"] {
  return async (_account, transaction: TransactionCommon & { fees: BigNumber }) => {
    const fees = await getAlpacaApi(network, kind).estimateFees(
      transactionToIntent(_account, transaction),
    );
    console.log("prepar fees:", fees);
    const bnFee = BigNumber(fees.value.toString());
    console.log("prepar bnFee:", bnFee);

    if (transaction.fees !== bnFee) {
      return { ...transaction, fees: bnFee };
    }

    return transaction;
  };
}
