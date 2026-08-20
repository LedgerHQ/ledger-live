import { AccountBridge } from "@ledgerhq/types-live";
import { AccountAwaitingSendPendingOperations } from "../../errors";
import BigNumber from "bignumber.js";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import {
  addAccountToBuyLinks,
  bigNumberToBigIntDeep,
  extractBalances,
  transactionToIntent,
} from "./utils";
import type { GenericTransaction } from "./types";

// => coin-framework validateIntent
export function genericGetTransactionStatus(
  network: string,
  kind: string,
): AccountBridge<GenericTransaction>["getTransactionStatus"] {
  return async (account, transaction) => {
    const coinModuleApi = await getCoinModuleApi(account.currency.id, kind);
    const context = buildContext(account.currency.id);
    const bridgeApi = await getBridgeApi(account.currency, network);

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
      data: transaction.data,
      type: transaction.type,
      valAddress: transaction.valAddress,
      valId: transaction.valId,
      dstValAddress: transaction.dstValAddress,
      familySpecificData: transaction.familySpecificData,
    };

    const chainSpecificValidation = bridgeApi.getChainSpecificRules;
    if (chainSpecificValidation) {
      if (chainSpecificValidation.getTransactionStatus.throwIfPendingOperation) {
        if (account.pendingOperations.length > 0) {
          throw new AccountAwaitingSendPendingOperations();
        }
      }
    }

    const buildIntentData = bridgeApi.buildIntentData;
    const intent = transactionToIntent(
      account,
      draftTransaction,
      bridgeApi.computeIntentType,
      intent => coinModuleApi.craftTransactionData(context, intent),
      // The real transaction, not the draft: the draft is a field-by-field allowlist, so a field it
      // omits reads as `undefined` inside the hook with no type error, and this path would validate
      // an intent whose `data` differs from the one `signOperation` hands the device. Everything the
      // framework itself derives keeps using the draft, so families that declare no hook are
      // untouched.
      buildIntentData && (() => buildIntentData(transaction)),
    );

    const customFees = bigNumberToBigIntDeep({
      value: transaction.fees ?? new BigNumber(0),
      parameters: {
        // The telemetry the last estimation returned, so a family that needs its own fee breakdown
        // here can read the one `prepareTransaction` just computed instead of estimating a second
        // time. `prepareTransaction` assigns the bag wholesale and clears it when a custom fee skips
        // estimation, so what arrives always belongs to the fee being validated.
        //
        // Spread first, and every field below is written unconditionally, so the framework's own
        // value wins any collision — including when it is `undefined`, which `bigNumberToBigIntDeep`
        // then drops, leaving the key absent exactly as it was before this bag was merged in.
        ...transaction.feeParameters,
        feesStrategy: transaction.feesStrategy ?? undefined,
        sponsored: transaction.sponsored,
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
        context,
        intent,
        extractBalances(account, bridgeApi.getAssetFromToken),
        { customFees },
      );

    return {
      errors: addAccountToBuyLinks(errors, account.id),
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
