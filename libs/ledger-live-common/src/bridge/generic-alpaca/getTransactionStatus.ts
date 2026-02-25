import { AccountBridge } from "@ledgerhq/types-live";
import { AccountAwaitingSendPendingOperations } from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import {
  bigNumberToBigIntDeep,
  extractBalances,
  applyMemoToIntent,
  transactionToIntent,
} from "./utils";
import { GenericTransaction } from "./types";

// => alpaca validateIntent
export function genericGetTransactionStatus(
  _network: string,
  kind: string,
): AccountBridge<GenericTransaction>["getTransactionStatus"] {
  return async (account, transaction) => {
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

    let intent = transactionToIntent(account, draftTransaction, alpacaApi.computeIntentType);
    intent = applyMemoToIntent(intent, transaction);

    const customFees = bigNumberToBigIntDeep({
      value: transaction.fees ?? new BigNumber(0),
      parameters: {
        gasLimit: transaction.gasLimit,
        gasPrice: transaction.gasPrice,
        maxFeePerGas: transaction.maxFeePerGas,
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
        additionalFees: transaction.additionalFees,
      },
    });
    const { errors, warnings, estimatedFees, amount, totalSpent, totalFees } =
      await alpacaApi.validateIntent(
        intent,
        extractBalances(account, alpacaApi.getAssetFromToken),
        customFees,
      );

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
