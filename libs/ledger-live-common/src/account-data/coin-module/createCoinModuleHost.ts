import { AccountDataNotServedError } from "@domain/api-account-data";
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
import { getEnv } from "@shared/env";
import { getCurrencyConfiguration } from "../../config";
import {
  hasLocalApi,
  loadBridgeApiForFamily,
  loadLocalApiForFamily,
} from "../../coin-modules/registry";

// A currency with no configuration (MultiversX is configured as `multiversx`, not `elrond`) is left to the next source.
function configurationOf(currencyId: string): Promise<CurrencyConfig> {
  try {
    return Promise.resolve(getCurrencyConfiguration(currencyId));
  } catch (error) {
    return Promise.reject(
      new AccountDataNotServedError(`No configuration for the ${currencyId} coin module`, {
        cause: error,
      }),
    );
  }
}

const contextOf = (currencyId: string): Context<CurrencyConfig> => ({
  config: (id?: string) => configurationOf(id ?? currencyId),
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
      // Mock accounts keep their simulated balances: only FullSync routes them to the mock bridges.
      if (getEnv("MOCK")) return false;
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
      // Staked and locked funds sit in staking positions, not in the native balance: only FullSync totals them.
      if (bridgeApi.usesStakingPositions) return undefined;
      const localApi = createLocalApi(currency.id);
      if (localApi.getBalance === undefined || isNotSupportedStub(localApi.getBalance)) {
        return undefined;
      }
      const api = withLogging(withDefaults(localApi));
      const context = contextOf(currency.id);
      return {
        // Only a family declaring `balanceOptions` accepts them: some reject any options, `{}` included.
        getBalance: subject => api.getBalance(context, subject, bridgeApi.balanceOptions),
        // Absent without a resolver, so the source falls through on a listed token instead of dropping it.
        getTokenId: bridgeApi.getTokenFromAsset
          ? async asset => (await bridgeApi.getTokenFromAsset?.(asset))?.id
          : undefined,
        partitionsNativeBalance: bridgeApi.partitionsNativeBalance,
      };
    },
  };
}
