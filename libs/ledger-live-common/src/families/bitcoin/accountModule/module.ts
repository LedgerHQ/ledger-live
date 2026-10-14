import {
  createUtxoAccountModule,
  type UtxoAccountModuleApi,
  type UtxoCoinModuleApi,
} from "@ledgerhq/account-module-utxo";
import { getCoinModuleApi } from "../../../bridge/generic-coin-framework/api";
import { getBitcoinCoinConfig } from "../coinConfig";

/** The UTXO account module of a bitcoin-like currency, on its coin module. */
export const bitcoinAccountModule = (
  api: UtxoCoinModuleApi,
  currencyId: string,
): UtxoAccountModuleApi =>
  createUtxoAccountModule(api, {
    replacedOperationExpiryMs: async () =>
      getBitcoinCoinConfig(currencyId).sync?.replacedOperationExpiryMs,
  });

/** The account module on the currency's local coin module, for the flows outside the bridge. */
export async function bitcoinAccountModuleOf(currencyId: string): Promise<UtxoAccountModuleApi> {
  const api = await getCoinModuleApi(currencyId, "local");
  return bitcoinAccountModule(api as unknown as UtxoCoinModuleApi, currencyId);
}
