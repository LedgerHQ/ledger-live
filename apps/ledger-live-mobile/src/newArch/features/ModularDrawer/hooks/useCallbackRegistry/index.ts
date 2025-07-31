import { AccountLike } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";
import { callbackRegistry, observableRegistry, resetAllRegistries } from "./registries";
import { RegistryManager, AccountCallback } from "./types";

/**
 * Hook to manage a callback registry for account selection callbacks and observables.
 * This replaces storing functions and observables directly in Redux state, which is an anti-pattern.
 */
export const useCallbackRegistry = (): RegistryManager => {
  // Callback methods
  const registerCallback = (id: string, callback: AccountCallback) =>
    callbackRegistry.register(id, callback);

  const getCallback = (id: string): AccountCallback | undefined => callbackRegistry.get(id);

  const unregisterCallback = (id: string): boolean => callbackRegistry.unregister(id);

  const hasCallback = (id: string): boolean => callbackRegistry.has(id);

  const executeCallback = (id: string, account: AccountLike, parentAccount?: AccountLike) => {
    const callback = callbackRegistry.get(id);
    if (callback) {
      callback(account, parentAccount);
      callbackRegistry.unregister(id);
    }
  };

  const clearCallbacks = () => callbackRegistry.clear();

  const getCallbackKeys = (): string[] => callbackRegistry.keys();

  // Observable methods
  const registerObservable = (id: string, observable: Observable<WalletAPIAccount[]>) =>
    observableRegistry.register(id, observable);

  const getObservable = (id: string): Observable<WalletAPIAccount[]> | undefined =>
    observableRegistry.get(id);

  const unregisterObservable = (id: string): boolean => observableRegistry.unregister(id);

  const hasObservable = (id: string): boolean => observableRegistry.has(id);

  const clearObservables = () => observableRegistry.clear();

  const getObservableKeys = (): string[] => observableRegistry.keys();

  // Reset methods
  const resetAll = () => resetAllRegistries();

  return {
    // Callback methods
    registerCallback,
    getCallback,
    unregisterCallback,
    hasCallback,
    executeCallback,
    clearCallbacks,
    getCallbackKeys,

    // Observable methods
    registerObservable,
    getObservable,
    unregisterObservable,
    hasObservable,
    clearObservables,
    getObservableKeys,

    // Reset methods
    resetAll,
  };
};
