import { AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";

// => alpaca validateIntent
export function genericGetTransactionStatus(
  network,
  kind,
): AccountBridge<any>["getTransactionStatus"] {
  return async (account, transaction: TransactionCommon & { fees: BigNumber }) => {
    const { freshAddress, balance, currency, pendingOperations, spendableBalance } = account;
    console.log("getTransactionStatus account", spendableBalance.toString());
    const alpacaApi = getAlpacaApi(network, kind);
    const { errors, warnings, estimatedFees, amount, totalSpent } = await alpacaApi.validateIntent(
      {
        currencyName: currency.name,
        address: freshAddress,
        balance: BigInt(balance.toString()),
        currencyUnit: currency.units[0],
        pendingOperations: pendingOperations.length,
        spendableBalance: BigInt(spendableBalance.toString()),
      },
      {
        type: "PAYMENT", // NOTE: assuming payment by default here
        recipient: transaction.recipient,
        amount: BigInt(transaction.amount?.toString() ?? "0"),
        fee: BigInt(transaction.fees?.toString() ?? "0"),
        useAllAmount: !!transaction.useAllAmount,
      },
    );

    return Promise.resolve({
      errors,
      warnings,
      estimatedFees: transaction.fees.eq(0)
        ? new BigNumber(estimatedFees.toString())
        : transaction.fees,
      amount: transaction.amount.eq(0) ? new BigNumber(amount.toString()) : transaction.amount,
      totalSpent: transaction.amount.eq(0)
        ? new BigNumber(totalSpent.toString())
        : transaction.amount.plus(transaction.fees),
    });
  };
}
