import { AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";

// => alpaca validateIntent
export function genericGetTransactionStatus(
  network,
  kind,
): AccountBridge<any>["getTransactionStatus"] {
  return async (
    account,
    transaction: TransactionCommon & {
      fees: BigNumber;
      assetIssuer?: string;
      assetCode?: string;
      mode?: string;
      subAccountId?: string;
    },
  ) => {
    const { freshAddress, balance, currency, pendingOperations, subAccounts } = account;
    let { spendableBalance } = account;

    if (subAccounts && transaction?.subAccountId) {
      spendableBalance =
        subAccounts.find(t => t.id === transaction.subAccountId)?.spendableBalance ||
        new BigNumber(0);
    }
    const alpacaApi = getAlpacaApi(network, kind);
    let transactionType = "PAYMENT"; // NOTE: assuming payment by default here, can be changed based on transaction.mode
    if (transaction.mode) {
      switch (transaction.mode) {
        case "changetrust":
          transactionType = "changeTrust";
          break;
        case "send":
          transactionType = "send";
          break;
        default:
          throw new Error(`Unsupported transaction mode: ${transaction.mode}`);
      }
    }

    /*
        * NOTE: stellar 
        *   const supportedOperationTypes = [
    "create_account",
    "payment",
    "path_payment_strict_send",
    "path_payment_strict_receive",
    "change_trust",
  ];
      */

    // debugger;
    const { errors, warnings, estimatedFees, amount, totalSpent } = await alpacaApi.validateIntent(
      {
        currencyName: currency.name,
        address: freshAddress,
        balance: BigInt(balance.toString()),
        currencyUnit: currency.units[0],
        pendingOperations: pendingOperations.length,
        spendableBalance: BigInt(spendableBalance.toString()),
        subAccount: subAccounts
          ? subAccounts.find(t => t.id === transaction.subAccountId)
          : undefined,
      },
      {
        type: transactionType,
        recipient: transaction.recipient,
        amount: BigInt(transaction.amount?.toString() ?? "0"),
        fee: BigInt(transaction.fees?.toString() ?? "0"),
        useAllAmount: !!transaction.useAllAmount,
        assetCode: transaction.assetCode || "",
        assetIssuer: transaction.assetIssuer || "",
        subAccountId: transaction.subAccountId || "",
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
