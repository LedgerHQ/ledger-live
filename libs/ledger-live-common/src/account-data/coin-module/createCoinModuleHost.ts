import type { CoinModuleHost } from "@features/platform-account-source-coin-module";
import { getCryptoCurrencyById, type CryptoCurrency } from "@domain/entity-currency-crypto";
import {
  isNotSupportedStub,
  withDefaults,
  withLogging,
} from "@ledgerhq/coin-module-framework/api/index";
import type { Context, CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import { log } from "@ledgerhq/logs";
import { getCurrencyConfiguration } from "../../config";
import {
  hasLocalApi,
  loadBridgeApiForFamily,
  loadLocalApiForFamily,
} from "../../coin-modules/registry";

const contextOf = (currencyId: string): Context<CurrencyConfig> => ({
  config: async (id?: string) => getCurrencyConfiguration(id ?? currencyId),
  logger: (type, message, data) =>
    log(String(type), message === undefined ? undefined : String(message), data),
});

async function loadBridgeApi(currency: CryptoCurrency): Promise<BridgeApi> {
  const bridgeApi = await loadBridgeApiForFamily(currency.family);
  return typeof bridgeApi === "function" ? bridgeApi(currency) : (bridgeApi ?? {});
}

/** The local coin modules the app registered, read from the registry with no generic-coin-framework layer. No coin module reads a utxo account from its xpub yet, so none is served. */
export function createCoinModuleHost(
  options: Pick<CoinModuleHost, "blacklistedTokenIds"> = {},
): CoinModuleHost {
  return {
    ...options,
    isCurrencySupported(currencyId) {
      try {
        return hasLocalApi(getCryptoCurrencyById(currencyId));
      } catch {
        return false;
      }
    },
    async getApi(currencyId) {
      const currency = getCryptoCurrencyById(currencyId);
      const [createLocalApi, bridgeApi] = await Promise.all([
        loadLocalApiForFamily(currency.family),
        loadBridgeApi(currency),
      ]);
      if (!createLocalApi) throw new Error(`No local coin module api for ${currency.id}`);
      const localApi = createLocalApi(currency.id);
      if (localApi.getBalance === undefined || isNotSupportedStub(localApi.getBalance)) {
        return undefined;
      }
      const api = withLogging(withDefaults(localApi));
      const context = contextOf(currency.id);
      return {
        // Only a family declaring `balanceOptions` accepts them: some reject any options, `{}` included.
        getBalance: subject => api.getBalance(context, subject, bridgeApi.balanceOptions),
        getTokenId: async asset => (await bridgeApi.getTokenFromAsset?.(asset))?.id,
        partitionsNativeBalance: bridgeApi.partitionsNativeBalance,
      };
    },
  };
}
