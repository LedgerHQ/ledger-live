import { Account, AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { getAlpacaApi } from "./alpaca";
import { transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";

export function genericPrepareTransaction(
  network,
  kind,
): AccountBridge<TransactionCommon, Account, any, any>["prepareTransaction"] {
  return async (_account, transaction: any) => {
    const fees = await getAlpacaApi(network, kind).estimateFees(
      transactionToIntent(_account, transaction),
    );

    const bnFee = BigNumber(fees.toString());

    if (transaction.fees !== bnFee) {
      return { ...transaction, fees: bnFee };
    }

    return transaction;
  };
}
