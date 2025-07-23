import { AccountBridge, TransactionCommon } from "@ledgerhq/types-live";
import { AccountAwaitingSendPendingOperations } from "@ledgerhq/errors";

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
    const alpacaApi = getAlpacaApi(network, kind);
    const draftTransaction = {
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

    if (alpacaApi.getChainSpecificRules) {
      const chainSpecificValidation = alpacaApi.getChainSpecificRules();
      if (chainSpecificValidation.getTransactionStatus.throwIfPendingOperation) {
        if (account.pendingOperations.length > 0) {
          throw new AccountAwaitingSendPendingOperations();
        }
      }
    }

    const { errors, warnings, estimatedFees, amount, totalSpent } = await alpacaApi.validateIntent(
      transactionToIntent(account, draftTransaction),
    );

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
