import type { Account } from "@ledgerhq/types-live";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { GenericCoinFrameworkTransactionIntent } from "./utils";

/**
 * Hands the intent to the family's account layer (ADR-065), which adds what only the whole account
 * knows — for a UTXO family the selected inputs, the change and the signing paths. A family without
 * an account layer gets its intent back untouched.
 */
export async function completeIntent(
  bridgeApi: BridgeApi,
  intent: GenericCoinFrameworkTransactionIntent,
  account: Account,
  transaction: object,
  api: CoinModuleApi<any, any, any>,
  context: Context<any>,
): Promise<GenericCoinFrameworkTransactionIntent> {
  if (!bridgeApi.accountLayer) return intent;
  return (await bridgeApi.accountLayer.completeIntent(intent, account, { ...transaction }, {
    api,
    context,
  })) as GenericCoinFrameworkTransactionIntent;
}
