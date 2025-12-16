import { AccountBridge } from "@ledgerhq/types-live";
import { AccountAwaitingSendPendingOperations } from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import { applyMemoToIntent, transactionToIntent } from "./utils";
import { GenericTransaction } from "./types";

// => alpaca validateIntent
export function genericGetTransactionStatus(
  network,
  kind,
): AccountBridge<any>["getTransactionStatus"] {
  return async (account, transaction: GenericTransaction) => {
    const alpacaApi = getAlpacaApi(account.currency.id, kind);
    const draftTransaction = {
      mode: transaction?.mode ?? "send",
      recipient: transaction.recipient,
      amount: transaction.amount ?? new BigNumber(0),
      useAllAmount: !!transaction.useAllAmount,
      assetReference: transaction.assetReference || "",
      assetOwner: transaction.assetOwner || "",
      subAccountId: transaction.subAccountId || "",
      memoType: transaction.memoType || "",
      memoValue: transaction.memoValue || "",
      family: transaction.family,
      feesStrategy: transaction.feesStrategy,
      data: transaction.data,
      type: transaction.type,
      sponsored: transaction.sponsored,
    };

    if (alpacaApi.getChainSpecificRules) {
      const chainSpecificValidation = alpacaApi.getChainSpecificRules();
      if (chainSpecificValidation.getTransactionStatus.throwIfPendingOperation) {
        if (account.pendingOperations.length > 0) {
          throw new AccountAwaitingSendPendingOperations();
        }
      }
    }

    const fees = BigInt(transaction.fees?.toString() || "0");
    const feesParameters = {
      ...(transaction.gasLimit ? { gasLimit: BigInt(transaction.gasLimit.toFixed()) } : {}),
      ...(transaction.gasPrice ? { gasPrice: BigInt(transaction.gasPrice.toFixed()) } : {}),
      ...(transaction.maxFeePerGas
        ? { maxFeePerGas: BigInt(transaction.maxFeePerGas.toFixed()) }
        : {}),
      ...(transaction.maxPriorityFeePerGas
        ? { maxPriorityFeePerGas: BigInt(transaction.maxPriorityFeePerGas.toFixed()) }
        : {}),
      ...(transaction.additionalFees
        ? { additionalFees: BigInt(transaction.additionalFees.toFixed()) }
        : {}),
    };

    let intent = transactionToIntent(account, draftTransaction, alpacaApi.computeIntentType);
    intent = applyMemoToIntent(intent, transaction);

    const { errors, warnings, estimatedFees, amount, totalSpent, totalFees } =
      await alpacaApi.validateIntent(intent, { value: fees, parameters: feesParameters });

    return {
      errors,
      warnings,
      totalFees: typeof totalFees === "bigint" ? new BigNumber(totalFees.toString()) : undefined,
      estimatedFees:
        !transaction.fees || transaction.fees.isZero()
          ? new BigNumber(estimatedFees.toString())
          : transaction.fees,
      amount: transaction.amount.eq(0) ? new BigNumber(amount.toString()) : transaction.amount,
      totalSpent: new BigNumber(totalSpent.toString()),
    };
  };
}
