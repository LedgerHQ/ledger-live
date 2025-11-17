import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AccountLike } from "@ledgerhq/types-live";
import {
  openModularDrawer,
  closeModularDrawer,
  modularDrawerStateSelector,
} from "~/reducers/modularDrawer";
import { DrawerParams, DrawerRemoteParams } from "../types";
import { useCallbackRegistry } from "./useCallbackRegistry";
import { generateCallbackId } from "../utils/callbackIdGenerator";

/**
 * Hook to manage the global state of the Modular Drawer.
 *
 * This hook provides a centralized way to:
 * - Open/close the modular drawer
 * - Manage account selection callbacks
 * - Handle drawer state through Redux
 * - Clean up resources when drawer closes
 *
 * The hook uses a callback registry to manage callbacks
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
    assetsConfiguration,
    networksConfiguration,
    useCase,
    areCurrenciesFiltered,
  } = useSelector(modularDrawerStateSelector);

  const { registerCallback, executeCallback, unregisterCallback, resetAll } = useCallbackRegistry();

  const openDrawer = useCallback(
    (params?: DrawerParams) => {
      const { onAccountSelected, ...otherParams } = params || {};

      resetAll();
      if (callbackId) {
        unregisterCallback(callbackId);
      }

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

      const paramsWithIds: DrawerRemoteParams = {
        ...otherParams,
        callbackId: callbackIdToUse,
      };

      dispatch(openModularDrawer(paramsWithIds));
    },
    [resetAll, callbackId, dispatch, unregisterCallback, registerCallback],
  );

  const closeDrawer = useCallback(() => {
    dispatch(closeModularDrawer());
  }, [dispatch]);

  const handleAccountSelected = useCallback(
    (account: AccountLike, parentAccount?: AccountLike) => {
      if (callbackId) {
        executeCallback(callbackId, account, parentAccount);
      }
      closeDrawer();
    },
    [callbackId, executeCallback, closeDrawer],
  );

  return {
    isOpen,
    preselectedCurrencies,
    enableAccountSelection,
    assetsConfiguration,
    networksConfiguration,
    useCase,
    areCurrenciesFiltered,
    openDrawer,
    closeDrawer,
    handleAccountSelected,
  };
};
