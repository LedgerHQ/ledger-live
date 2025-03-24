import { getAlpacaApi } from "./alpaca";
import { transactionToIntent } from "./utils";

export async function genericPrepareTransaction(network, kind) {
  return async (_account, transaction: any) => {
    const fees = await getAlpacaApi(network, kind).estimateFees(
      transactionToIntent(_account, transaction),
    );

    if (transaction.fee !== fees) {
      return { ...transaction, fee: fees };
    }

    return transaction;
  };
}
