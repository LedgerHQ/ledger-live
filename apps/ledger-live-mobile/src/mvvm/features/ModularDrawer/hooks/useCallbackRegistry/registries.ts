import { AccountLike } from "@ledgerhq/types-live";
import { Registry } from "./Registry";
import { AccountCallback, RegistryManager } from "./types";

// Global registries that persist across re-renders
export const callbackRegistry = new Registry<AccountCallback>();

/**
 * Reset all registries - should be called during app reset/cleanup
 */
export const resetAllRegistries = () => {
  callbackRegistry.clear();
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

  clearCallbacks: () => callbackRegistry.clear(),

  getCallbackKeys: (): string[] => callbackRegistry.keys(),

  resetAll: () => resetAllRegistries(),
};
