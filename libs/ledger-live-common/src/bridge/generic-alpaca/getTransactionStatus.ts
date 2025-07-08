import { AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import { transactionToIntent } from "./utils";

// => alpaca validateIntent
export function genericGetTransactionStatus(
  network,
  kind,
): AccountBridge<any>["getTransactionStatus"] {
  return async (
    account,
    transaction: TransactionCommon & {
      fees: bigint | null | undefined;
      assetIssuer?: string;
      assetCode?: string;
      mode?: string;
      subAccountId?: string;
      memoType?: string;
      memoValue?: string;
    },
  ) => {
    // const { freshAddress, balance, currency, pendingOperations, subAccounts, spendableBalance } =
    //   account;

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
    const draftTransaction = {
      type: transactionType,
      recipient: transaction.recipient,
      amount: transaction.amount ?? new BigNumber(0),
      fees: transaction.fees ?? 0n,
      useAllAmount: !!transaction.useAllAmount,
      assetCode: transaction.assetCode || "",
      assetIssuer: transaction.assetIssuer || "",
      subAccountId: transaction.subAccountId || "",
      memoType: transaction.memoType || "",
      memoValue: transaction.memoValue || "",
    };
    // console.log("getTransactionStatus draftTransaction: ", transaction);
    const { errors, warnings, estimatedFees, amount, totalSpent } = await alpacaApi.validateIntent(
      transactionToIntent(account, draftTransaction),
      // {
      //   currencyName: currency.name,
      //   address: freshAddress,
      //   balance: BigInt(balance.toString()),
      //   currencyUnit: currency.units[0],
      //   pendingOperations: pendingOperations.length,
      //   spendableBalance: BigInt(spendableBalance.toString()),
      //   subAccount: subAccounts
      //     ? subAccounts.find(t => t.id === transaction.subAccountId)
      //     : undefined,
      // },
      // {
      //   type: transactionType,
      //   recipient: transaction.recipient,
      //   amount: BigInt(transaction.amount?.toString() ?? "0"),
      //   fee: BigInt(transaction.fees?.toString() ?? "0"),
      //   useAllAmount: !!transaction.useAllAmount,
      //   assetCode: transaction.assetCode || "",
      //   assetIssuer: transaction.assetIssuer || "",
      //   subAccountId: transaction.subAccountId || "",
      //   memoType: transaction.memoType || "",
      //   memoValue: transaction.memoValue || "",
      // },
    );

    // console.log("getTransactionStatus: ", transaction);
    // console.log("getTransactionStatus estimatedFees: ", amount.toString());
    // console.log("getTransactionStatus transaction.amount: ", transaction.amount.toString());
    return Promise.resolve({
      errors,
      warnings,
      estimatedFees:
        !transaction.fees || transaction.fees === 0n
          ? new BigNumber(estimatedFees.toString())
          : new BigNumber(transaction.fees.toString()),
      amount: transaction.amount.eq(0) ? new BigNumber(amount.toString()) : transaction.amount,
      totalSpent: transaction.amount.eq(0)
        ? new BigNumber(totalSpent.toString())
        : transaction.amount.plus(new BigNumber(transaction.fees?.toString() || "0")),
    });
  };
}
