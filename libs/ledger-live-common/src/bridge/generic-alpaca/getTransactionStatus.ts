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
    const alpacaApi = getAlpacaApi(network, kind);
    const { errors, warnings } = await alpacaApi.validateIntent(
      {
        currencyName: currency.name,
        address: freshAddress,
        balance: BigInt(balance.toString()),
        currencyUnit: currency.units[0],
      },
      {
        type: "PAYMENT", // NOTE: assuming payment by default here
        recipient: transaction.recipient,
        amount: BigInt(transaction.amount?.toString() ?? "0"),
        fee: BigInt(transaction.fees?.toString() ?? "0"),
      },
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
