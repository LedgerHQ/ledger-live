import type { CoinModule } from "@features/platform-account-source-coin-module";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { getCoinModuleApi } from "../bridge/generic-coin-framework/api/index";
import { buildContext } from "../bridge/generic-coin-framework/api/context";
import { getBridgeApi } from "../bridge/generic-coin-framework/bridge";

/** A currency's coin module, loaded lazily through the existing registry, its context bound. */
export async function loadCoinModule(currencyId: string): Promise<CoinModule> {
  const currency = getCryptoCurrencyById(currencyId);
  const [api, bridgeApi] = await Promise.all([
    getCoinModuleApi(currency.id, "local"),
    getBridgeApi(currency, currency.family),
  ]);
  const context = buildContext(currency.id);
  return {
    getBalance: address => api.getBalance(context, address, bridgeApi.balanceOptions),
    listOperations: (address, { cursor, limit }) =>
      api.listOperations(context, address, {
        minHeight: 0,
        cursor,
        order: "desc",
        ...(limit === undefined ? {} : { limit }),
      }),
    tokenOf: async asset => bridgeApi.getTokenFromAsset?.(asset),
    partitionsNativeBalance: bridgeApi.partitionsNativeBalance,
  };
}
