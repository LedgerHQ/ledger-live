import { createApi as createBitcoinApi } from "@ledgerhq/coin-bitcoin/api";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";

// The coin config (explorer, fee and sync settings) is read from the Context bound in
// getCoinModuleApi at each call, so a remote change of `config_currency_<id>` applies at once.
export function createLocalBitcoinApi(currencyId: string): CoinModuleApi<any> & BridgeApi {
  return createBitcoinApi(currencyId) as unknown as CoinModuleApi<any> & BridgeApi;
}
