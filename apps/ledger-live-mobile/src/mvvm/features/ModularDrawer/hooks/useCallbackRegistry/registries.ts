import { AccountLike } from "@ledgerhq/types-live";
import { Registry } from "./Registry";
import { AccountCallback, CurrencyCallback, RegistryManager } from "./types";

// Global registries that persist across re-renders
export const callbackRegistry = new Registry<AccountCallback>();
export const currencyCallbackRegistry = new Registry<CurrencyCallback>();

/**
 * Reset all registries - should be called during app reset/cleanup
 */
export const resetAllRegistries = () => {
  callbackRegistry.clear();
  currencyCallbackRegistry.clear();
};

export const registryActions: RegistryManager = {
  registerCallback: (id: string, callback: AccountCallback) =>
    callbackRegistry.register(id, callback),

  getCallback: (id: string): AccountCallback | undefined => callbackRegistry.get(id),

  unregisterCallback: (id: string): boolean => callbackRegistry.unregister(id),

  hasCallback: (id: string): boolean => callbackRegistry.has(id),

  executeCallback: (id: string, account: AccountLike, parentAccount?: AccountLike) => {
    const callback = callbackRegistry.get(id);
    if (callback) {
      callback(account, parentAccount);
      callbackRegistry.unregister(id);
    }
  },

  registerCurrencyCallback: (id, callback) => currencyCallbackRegistry.register(id, callback),

  executeCurrencyCallback: (id, currency) => {
    const callback = currencyCallbackRegistry.get(id);
    if (callback) {
      callback(currency);
      currencyCallbackRegistry.unregister(id);
    }
  },

  clearCallbacks: () => callbackRegistry.clear(),

  getCallbackKeys: (): string[] => callbackRegistry.keys(),

  resetAll: () => resetAllRegistries(),
};
