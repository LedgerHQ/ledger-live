import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CoinModuleSourceHost } from "@features/platform-account-source-coin-module";
import { getCoinModuleApi } from "../bridge/generic-coin-framework/api/index";
import { buildContext } from "../bridge/generic-coin-framework/api/context";
import { getBridgeApi } from "../bridge/generic-coin-framework/bridge";
import { getEnabledGenericCoinFrameworkFamilies } from "../bridge/generic-coin-framework/genericCoinFrameworkFamilies";

/** What `CoinModuleSource` needs from the coin-module registry, bound to live-common's lazy loaders. */
export function createCoinModuleHost(
  options: { blacklistedTokenIds?: () => readonly string[] } = {},
): CoinModuleSourceHost {
  return {
    async loadApi(currencyId) {
      const currency = getCryptoCurrencyById(currencyId);
      const [api, bridgeApi] = await Promise.all([
        getCoinModuleApi(currency.id, "local"),
        getBridgeApi(currency, currency.family),
      ]);
      const context = buildContext(currency.id);
      return {
        getBalance: address => api.getBalance(context, address, bridgeApi.balanceOptions),
        listOperations: (address, { cursor, limit }) =>
          api.listOperations(context, address, { minHeight: 0, cursor, limit, order: "desc" }),
      };
    },
    async resolveToken(currencyId, asset) {
      const currency = getCryptoCurrencyById(currencyId);
      const bridgeApi = await getBridgeApi(currency, currency.family);
      return bridgeApi.getTokenFromAsset?.(asset);
    },
    granular: { balance: getEnabledGenericCoinFrameworkFamilies, operations: () => [] },
    blacklistedTokenIds: options.blacklistedTokenIds,
  };
}
