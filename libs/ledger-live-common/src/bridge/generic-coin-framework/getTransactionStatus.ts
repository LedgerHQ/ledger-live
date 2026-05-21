import { AccountBridge } from "@ledgerhq/types-live";
import { AccountAwaitingSendPendingOperations } from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { getCoinModuleApi } from "./api";
import { getBridgeApi } from "./bridge";
import { bigNumberToBigIntDeep, extractBalances, transactionToIntent } from "./utils";
import type { GenericTransaction } from "./types";

// => coin-framework validateIntent
export function genericGetTransactionStatus(
  network: string,
  kind: string,
): AccountBridge<GenericTransaction>["getTransactionStatus"] {
  return async (account, transaction) => {
    const coinModuleApi = await getCoinModuleApi(account.currency.id, kind);
    const bridgeApi = getBridgeApi(account.currency, network);

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
      tag: transaction.tag,
      family: transaction.family,
      feesStrategy: transaction.feesStrategy,
      data: transaction.data,
      type: transaction.type,
      sponsored: transaction.sponsored,
      valAddress: transaction.valAddress,
      dstValAddress: transaction.dstValAddress,
    };

    const chainSpecificValidation = bridgeApi.getChainSpecificRules;
    if (chainSpecificValidation) {
      if (chainSpecificValidation.getTransactionStatus.throwIfPendingOperation) {
        if (account.pendingOperations.length > 0) {
          throw new AccountAwaitingSendPendingOperations();
        }
      }
    }

    const intent = transactionToIntent(
      account,
      draftTransaction,
      bridgeApi.computeIntentType,
      coinModuleApi.craftTransactionData,
    );

    const customFees = bigNumberToBigIntDeep({
      value: transaction.fees ?? new BigNumber(0),
      parameters: {
        gasLimit: transaction.gasLimit,
        customGasLimit: transaction.customGasLimit,
        gasPrice: transaction.gasPrice,
        maxFeePerGas: transaction.maxFeePerGas,
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
        additionalFees: transaction.additionalFees,
      },
    });

    const { errors, warnings, estimatedFees, amount, totalSpent, totalFees } =
      await coinModuleApi.validateIntent(
        intent,
        extractBalances(account, bridgeApi.getAssetFromToken),
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
      amount: new BigNumber(amount.toString()),
      totalSpent: new BigNumber(totalSpent.toString()),
    };
  };
}
