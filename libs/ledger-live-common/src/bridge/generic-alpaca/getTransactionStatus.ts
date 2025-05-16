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
    if (!alpacaApi.validateIntent) {
      throw new Error("validateIntent is not implemented for this network/kind");
    }
    console.log("Transaction:", transaction);
    const { errors, warnings } = await alpacaApi.validateIntent(
      {
        currencyName: currency.name,
        address: freshAddress,
        balance: BigInt(balance.toString()),
        currencyUnit: currency.units[0],
      },
      /*
        *Transaction = {
    type: string;
    recipient: string;
    amount: bigint;
    fee: bigint;
} &
        */
      {
        type: "TODO",
        recipient: transaction.recipient,
        amount: BigInt(transaction.amount.toString()),
        fee: BigInt(transaction.fees.toString()),
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
