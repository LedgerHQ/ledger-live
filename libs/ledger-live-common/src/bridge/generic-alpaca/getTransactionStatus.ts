import { AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";

// => alpaca validateIntent
export function genericGetTransactionStatus(
  network,
  kind,
): AccountBridge<any>["getTransactionStatus"] {
  return async (account, transaction: TransactionCommon & { fees: BigNumber }) => {
    const { freshAddress, balance, currency } = account;
    const { errors, warnings } = await getAlpacaApi(network, kind).validateIntent(
      {
        currencyName: currency.name,
        address: freshAddress,
        balance: BigInt(balance.toString()),
        currencyUnit: currency.units[0],
      },
      transaction,
    );

    const estimatedFees = transaction.fees || new BigNumber(0);

    return Promise.resolve({
      errors,
      warnings,
      estimatedFees,
      amount: transaction.amount,
      totalSpent: transaction.amount.plus(transaction.fees),
    });
  };
}
