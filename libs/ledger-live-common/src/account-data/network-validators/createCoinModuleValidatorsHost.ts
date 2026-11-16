import type { CoinModuleValidatorsHost } from "@features/platform-account-source-coin-module";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import {
  isNotSupportedStub,
  withDefaults,
  withLogging,
} from "@ledgerhq/coin-module-framework/api/index";
import { loadCoinModuleStakesForFamily } from "../../coin-modules/registry";
import { contextOf, createCoinModuleHost, loadApis } from "../coin-module/createCoinModuleHost";
import { isLedgerValidator } from "./isLedgerValidator";

/** The validators of the local coin modules the app registered, with no generic-coin-framework layer. */
export function createCoinModuleValidatorsHost(): CoinModuleValidatorsHost {
  const { isCurrencySupported } = createCoinModuleHost();
  return {
    isCurrencySupported,
    isLedgerValidator,
    async getValidatorsApi(currencyId) {
      const currency = getCryptoCurrencyById(currencyId);
      const { createLocalApi } = await loadApis(currency);
      const localApi = createLocalApi(currency.id);
      if (localApi.getValidators === undefined || isNotSupportedStub(localApi.getValidators)) {
        return undefined;
      }
      const api = withLogging(withDefaults(localApi));
      const context = contextOf(currency.id);
      const { normalizeValidator } = (await loadCoinModuleStakesForFamily(currency.family)) ?? {};
      return {
        getValidators: async cursor => {
          const page = await api.getValidators(context, { cursor });
          const items = normalizeValidator ? page.items.map(normalizeValidator) : page.items;
          return page.next ? { items, next: page.next } : { items };
        },
      };
    },
  };
}
