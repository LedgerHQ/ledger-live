import { useCallback } from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { Observable } from "rxjs";
import { WalletAPIAccount } from "@ledgerhq/live-common/wallet-api/types";

type AccountCallback = (account: AccountLike, parentAccount?: AccountLike) => void;

interface CallbackRegistry {
  [id: string]: AccountCallback;
}

interface ObservableRegistry {
  [id: string]: Observable<WalletAPIAccount[]>;
}

// Global registry that persists across re-renders
const globalCallbacks: CallbackRegistry = {};
const globalObservables: ObservableRegistry = {};

/**
 * Hook to manage a callback registry for account selection callbacks and observables.
 * This replaces storing functions and observables directly in Redux state, which is an anti-pattern.
 */
export const useCallbackRegistry = () => {
  const registerCallback = useCallback((id: string, callback: AccountCallback) => {
    globalCallbacks[id] = callback;
  }, []);

  const getCallback = useCallback((id: string): AccountCallback | undefined => {
    return globalCallbacks[id];
  }, []);

  const unregisterCallback = useCallback((id: string) => {
    delete globalCallbacks[id];
  }, []);

  const executeCallback = useCallback(
    (id: string, account: AccountLike, parentAccount?: AccountLike) => {
      const callback = globalCallbacks[id];
      if (callback) {
        callback(account, parentAccount);
        unregisterCallback(id);
      }
    },
    [unregisterCallback],
  );

  const registerObservable = useCallback(
    (id: string, observable: Observable<WalletAPIAccount[]>) => {
      globalObservables[id] = observable;
    },
    [],
  );

  const getObservable = useCallback((id: string): Observable<WalletAPIAccount[]> | undefined => {
    return globalObservables[id];
  }, []);

  const unregisterObservable = useCallback((id: string) => {
    delete globalObservables[id];
  }, []);

  return {
    registerCallback,
    getCallback,
    unregisterCallback,
    executeCallback,
    registerObservable,
    getObservable,
    unregisterObservable,
  };
};
