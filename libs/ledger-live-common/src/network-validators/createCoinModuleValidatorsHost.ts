import type { CoinModuleValidatorsHost } from "@features/platform-account-source-coin-module";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  isNotSupportedStub,
  withDefaults,
  withLogging,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  contextOf,
  createCoinModuleHost,
  loadApis,
} from "../account-data/coin-module/createCoinModuleHost";

/** The validators of the local coin modules the app registered, with no generic-coin-framework layer. */
export function createCoinModuleValidatorsHost(): CoinModuleValidatorsHost {
  const { isCurrencySupported } = createCoinModuleHost();
  return {
    isCurrencySupported,
    async getValidatorsApi(currencyId) {
      const currency = getCryptoCurrencyById(currencyId);
      const { createLocalApi } = await loadApis(currency);
      const localApi = createLocalApi(currency.id);
      if (localApi.getValidators === undefined || isNotSupportedStub(localApi.getValidators)) {
        return undefined;
      }
      const api = withLogging(withDefaults(localApi));
      const context = contextOf(currency.id);
      return {
        getValidators: async cursor => {
          const { items, next } = await api.getValidators(context, { cursor });
          return next ? { items, next } : { items };
        },
      };
    },
  };
}
