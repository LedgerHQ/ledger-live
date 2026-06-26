import { AccountBridge } from "@ledgerhq/types-live";
import type { FeeEstimation } from "@ledgerhq/coin-module-framework/api/types";
import { getMainAccount } from "../../account";
import { getCoinModuleApi } from "./api";
import { createTransaction } from "./createTransaction";
import { computeUseAllAmount, getPendingTokenSpent, transactionToIntent } from "./utils";
import BigNumber from "bignumber.js";
import { GenericTransaction } from "./types";
import { getBridgeApi } from "./bridge";

export function genericEstimateMaxSpendable(
  network,
  kind,
): AccountBridge<GenericTransaction>["estimateMaxSpendable"] {
  return async ({ account, parentAccount, transaction }) => {
    if (account.type === "TokenAccount") {
      const pendingSpent = getPendingTokenSpent(account.pendingOperations ?? []);
      return BigNumber.max(0, account.spendableBalance.minus(pendingSpent));
    }
    const mainAccount = getMainAccount(account, parentAccount);
    const coinModuleApi = await getCoinModuleApi(mainAccount.currency.id, kind);
    const bridgeApi = await getBridgeApi(mainAccount.currency, network);
    const draftTransaction = {
      ...createTransaction(account),
      ...transaction,
      amount: mainAccount.spendableBalance,
      useAllAmount: true,
    };

    const estimation: FeeEstimation = BigNumber.isBigNumber(transaction?.fees)
      ? {
          value: BigInt(transaction.fees.toFixed()),
          parameters: BigNumber.isBigNumber(transaction?.additionalFees)
            ? { additionalFees: BigInt(transaction.additionalFees.toFixed()) }
            : undefined,
        }
      : await coinModuleApi.estimateFees(
          transactionToIntent(
            mainAccount,
            draftTransaction,
            bridgeApi.computeIntentType,
            coinModuleApi.craftTransactionData,
          ),
        );

    return computeUseAllAmount(estimation, account.spendableBalance);
  };
}
