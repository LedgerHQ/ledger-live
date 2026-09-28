import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { getAssetInfos } from "./prepareTransaction";
import type { GenericTransaction } from "./types";
import { getPendingTokenSpent, transactionToIntent } from "./utils";

/**
 * Converts a bridge `Transaction` into the `TransactionIntent` the sponsored-send seam methods take,
 * mirroring `prepareTransaction`. `network` is the family string; `kind` is the coin-module kind.
 */
export async function buildGenericTransactionIntent(
  network: string,
  kind: string,
  account: Account,
  transaction: GenericTransaction,
): Promise<ReturnType<typeof transactionToIntent>> {
  // Coin-module and context are keyed by currency id; getBridgeApi by the family (`network`) — the
  // two differ for a multi-currency family.
  const coinModuleApi = await getCoinModuleApi(account.currency.id, kind);
  const context = buildContext(account.currency.id);
  const bridgeApi = await getBridgeApi(account.currency, network);

  const getAssetFromTokenForCurrency = bridgeApi.getAssetFromToken;
  const { assetReference, assetOwner } = getAssetFromTokenForCurrency
    ? await getAssetInfos(transaction, account.freshAddress, getAssetFromTokenForCurrency)
    : {
        assetReference: transaction.assetReference ?? "",
        assetOwner: transaction.assetOwner ?? "",
      };

  // Mirror prepareTransaction: subtract pending outgoing token ops, or a max-send inflates the
  // requested energy/quote/order (pendingOperations aren't yet reflected in spendableBalance).
  let amount = transaction.amount;
  if (transaction.useAllAmount && transaction.subAccountId) {
    const subAccount = account.subAccounts?.find(acc => acc.id === transaction.subAccountId);
    if (subAccount) {
      const pendingTokenSpent = getPendingTokenSpent(subAccount.pendingOperations ?? []);
      amount = BigNumber.max(0, subAccount.spendableBalance.minus(pendingTokenSpent));
    }
  }

  return transactionToIntent(
    account,
    { ...transaction, assetOwner, assetReference, amount },
    bridgeApi.computeIntentType,
    intent => coinModuleApi.craftTransactionData(context, intent),
    bridgeApi.buildIntentData,
  );
}
