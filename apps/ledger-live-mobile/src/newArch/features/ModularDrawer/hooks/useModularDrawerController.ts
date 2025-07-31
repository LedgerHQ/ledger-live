import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AccountLike } from "@ledgerhq/types-live";
import {
  openModularDrawer,
  closeModularDrawer,
  modularDrawerStateSelector,
} from "~/reducers/modularDrawer";
import { OpenModularDrawerParams, OpenModularDrawerParamsWithCallbackId } from "../types";
import { useCallbackRegistry } from "./useCallbackRegistry";
import { generateCallbackId } from "../utils/callbackIdGenerator";

/**
 * Hook to manage the global state of the Modular Drawer.
 *
 * This hook provides a centralized way to:
 * - Open/close the modular drawer
 * - Manage account selection callbacks and observables
 * - Handle drawer state through Redux
 * - Clean up resources when drawer closes
 *
 * The hook uses a callback registry to manage callbacks and observables
 * that need to persist across component re-renders, replacing direct
 * function references with stable IDs for Redux serialization.
 *
 */
export const useModularDrawerController = () => {
  const dispatch = useDispatch();

  const {
    isOpen,
    preselectedCurrencies,
    callbackId,
    enableAccountSelection,
    accountsObservableId,
    flow,
    source,
  } = useSelector(modularDrawerStateSelector);

  const {
    registerCallback,
    executeCallback,
    unregisterCallback,
    registerObservable,
    getObservable,
    unregisterObservable,
    resetAll,
  } = useCallbackRegistry();

  const openDrawer = useCallback(
    (params?: OpenModularDrawerParams) => {
      const { onAccountSelected, accounts$, ...otherParams } = params || {};

      let callbackIdToUse: string | undefined;
      if (onAccountSelected) {
        const id = generateCallbackId();
        const wrappedCallback = (account: AccountLike, parentAccount?: AccountLike) => {
          const typedParentAccount =
            parentAccount && "derivationMode" in parentAccount ? parentAccount : undefined;
          onAccountSelected(account, typedParentAccount);
        };
        registerCallback(id, wrappedCallback);
        callbackIdToUse = id;
      }

      let observableIdToUse: string | undefined;
      if (accounts$) {
        const id = generateCallbackId();
        registerObservable(id, accounts$);
        observableIdToUse = id;
      }

      const paramsWithIds: OpenModularDrawerParamsWithCallbackId = {
        ...otherParams,
        callbackId: callbackIdToUse,
        accountsObservableId: observableIdToUse,
      };

      dispatch(openModularDrawer(paramsWithIds));
    },
    [dispatch, registerCallback, registerObservable],
  );

  const closeDrawer = useCallback(() => {
    // Cleanup specific callback and observable
    if (callbackId) {
      unregisterCallback(callbackId);
    }
    if (accountsObservableId) {
      unregisterObservable(accountsObservableId);
    }

    // Reset all registries to ensure complete cleanup
    resetAll();

    dispatch(closeModularDrawer());
  }, [
    dispatch,
    unregisterCallback,
    unregisterObservable,
    resetAll,
    callbackId,
    accountsObservableId,
  ]);

  const handleAccountSelected = useCallback(
    (account: AccountLike, parentAccount?: AccountLike) => {
      if (callbackId) {
        executeCallback(callbackId, account, parentAccount);
      }
      closeDrawer();
    },
    [callbackId, executeCallback, closeDrawer],
  );

  const getAccountsObservable = useCallback(() => {
    return accountsObservableId ? getObservable(accountsObservableId) : undefined;
  }, [accountsObservableId, getObservable]);

  return {
    isOpen,
    preselectedCurrencies,
    enableAccountSelection,
    flow,
    source,
    openDrawer,
    closeDrawer,
    handleAccountSelected,
    getAccountsObservable,
  };
};
