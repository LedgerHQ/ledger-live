import type { Account } from "@ledgerhq/types-live";
import { getCoinModuleApi } from "./api";
import { buildContext } from "./api/context";
import { getBridgeApi } from "./bridge";
import { getAssetInfos } from "./prepareTransaction";
import type { GenericTransaction } from "./types";
import { transactionToIntent } from "./utils";

/**
 * Build the `TransactionIntent` for a generic-coin-framework transaction the same way
 * `prepareTransaction` does — resolving the family's asset info (`assetReference`/`assetOwner`) and
 * running the shared `transactionToIntent` with the family's `computeIntentType`/`buildIntentData`.
 *
 * The sponsored-send seam methods (`listFeeOptions`, `estimateSponsoredFeeQuote`,
 * `buildEnergyRentRequest`) take a `TransactionIntent`, but the app holds a bridge `Transaction`; this
 * is the one place that turns the latter into the former without the app touching family internals or
 * re-deriving the token asset by hand. `network`/`kind` mirror `getCoinModuleApi` (`kind = "local"`
 * for a generic-coin-framework family). Kept a thin standalone helper rather than refactoring that
 * hot path.
 */
export async function buildGenericTransactionIntent(
  network: string,
  kind: string,
  account: Account,
  transaction: GenericTransaction,
): Promise<ReturnType<typeof transactionToIntent>> {
  // Resolve by `network` (the chain id), never `account.currency.id`: these agree only when the
  // caller passes the parent-chain account, but the seam resolves by chain id, so use the param the
  // signature already carries — the same key getBridgeApi below uses — to stay correct for a token
  // account too.
  const coinModuleApi = await getCoinModuleApi(network, kind);
  const context = buildContext(network);
  const bridgeApi = await getBridgeApi(account.currency, network);

  const getAssetFromTokenForCurrency = bridgeApi.getAssetFromToken;
  const { assetReference, assetOwner } = getAssetFromTokenForCurrency
    ? await getAssetInfos(transaction, account.freshAddress, getAssetFromTokenForCurrency)
    : {
        assetReference: transaction.assetReference ?? "",
        assetOwner: transaction.assetOwner ?? "",
      };

  // Mirror prepareTransaction: a token max-send zeroes `amount`, but fee/energy estimation needs the
  // real spendable, so read it from the sub-account when `useAllAmount` is set on a token transfer.
  let amount = transaction.amount;
  if (transaction.useAllAmount && transaction.subAccountId) {
    const subAccount = account.subAccounts?.find(acc => acc.id === transaction.subAccountId);
    if (subAccount) amount = subAccount.spendableBalance;
  }

  return transactionToIntent(
    account,
    { ...transaction, assetOwner, assetReference, amount },
    bridgeApi.computeIntentType,
    intent => coinModuleApi.craftTransactionData(context, intent),
    bridgeApi.buildIntentData,
  );
}
