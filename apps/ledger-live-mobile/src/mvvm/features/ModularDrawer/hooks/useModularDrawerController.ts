import { useCallback } from "react";
import { shallowEqual } from "react-redux";
import { useSelector, useDispatch } from "~/context/hooks";
import { AccountLike } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { openModularDrawer, closeModularDrawer, hideModularDrawer } from "~/reducers/modularDrawer";
import type { State } from "~/reducers/types";
import { DrawerParams, DrawerRemoteParams } from "../types";
import { useCallbackRegistry } from "./useCallbackRegistry";
import { generateCallbackId } from "../utils/callbackIdGenerator";

function resolveCallbackId<T>(
  callback: T | undefined,
  register: (id: string, cb: T) => void,
): string | undefined {
  if (!callback) return undefined;
  const id = generateCallbackId();
  register(id, callback);
  return id;
}

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
    categories,
    callbackId,
    cancelCallbackId,
    enableAccountSelection,
    completionMode,
    presentation,
    assetsConfiguration,
    networksConfiguration,
    useCase,
    uiUseCase,
    areCurrenciesFiltered,
    selectableNetworkIds,
  } = useSelector(
    (state: State) => ({
      isOpen: state.modularDrawer.isOpen,
      preselectedCurrencies: state.modularDrawer.preselectedCurrencies,
      categories: state.modularDrawer.categories,
      callbackId: state.modularDrawer.callbackId,
      cancelCallbackId: state.modularDrawer.cancelCallbackId,
      enableAccountSelection: state.modularDrawer.enableAccountSelection,
      completionMode: state.modularDrawer.completionMode,
      presentation: state.modularDrawer.presentation,
      assetsConfiguration: state.modularDrawer.assetsConfiguration,
      networksConfiguration: state.modularDrawer.networksConfiguration,
      useCase: state.modularDrawer.useCase,
      uiUseCase: state.modularDrawer.uiUseCase,
      areCurrenciesFiltered: state.modularDrawer.areCurrenciesFiltered,
      selectableNetworkIds: state.modularDrawer.selectableNetworkIds,
    }),
    shallowEqual,
  );

  const {
    registerCallback,
    executeCallback,
    registerCurrencyCallback,
    executeCurrencyCallback,
    registerCancelCallback,
    executeCancelCallback,
    unregisterCancelCallback,
    resetAll,
  } = useCallbackRegistry();

  const openDrawer = useCallback(
    (params?: DrawerParams) => {
      const { onAccountSelected, onCurrencySelected, onCancel, ...otherParams } = params ?? {};

      if (completionMode === "currency" && callbackId) {
        executeCurrencyCallback(callbackId, null);
      }
      resetAll();

      const wrappedAccountCallback = onAccountSelected
        ? (account: AccountLike, parentAccount?: AccountLike) => {
            const typedParentAccount =
              parentAccount && "derivationMode" in parentAccount ? parentAccount : undefined;
            onAccountSelected(account, typedParentAccount);
          }
        : undefined;

      const callbackIdToUse =
        resolveCallbackId(wrappedAccountCallback, registerCallback) ??
        resolveCallbackId(onCurrencySelected, registerCurrencyCallback);

      const cancelCallbackIdToUse = resolveCallbackId(onCancel, registerCancelCallback);

      const paramsWithIds: DrawerRemoteParams = {
        ...otherParams,
        callbackId: callbackIdToUse,
        cancelCallbackId: cancelCallbackIdToUse,
      };

      dispatch(openModularDrawer(paramsWithIds));
    },
    [
      callbackId,
      completionMode,
      dispatch,
      executeCurrencyCallback,
      registerCallback,
      registerCurrencyCallback,
      registerCancelCallback,
      resetAll,
    ],
  );

  const closeDrawer = useCallback(() => {
    try {
      if (completionMode === "currency" && callbackId) {
        executeCurrencyCallback(callbackId, null);
      }
      if (cancelCallbackId) {
        executeCancelCallback(cancelCallbackId);
      }
    } finally {
      dispatch(closeModularDrawer());
    }
  }, [
    callbackId,
    cancelCallbackId,
    completionMode,
    dispatch,
    executeCurrencyCallback,
    executeCancelCallback,
  ]);

  // Hides the drawer UI without firing the cancel callback. Use this when
  // navigating away inline (e.g. to device selection for add-account) so that
  // account.request stays pending until the user either completes or abandons.
  const hideDrawer = useCallback(() => {
    dispatch(hideModularDrawer());
  }, [dispatch]);

  const handleAccountSelected = useCallback(
    (account: AccountLike, parentAccount?: AccountLike) => {
      if (cancelCallbackId) {
        unregisterCancelCallback(cancelCallbackId);
      }
      try {
        if (callbackId) {
          executeCallback(callbackId, account, parentAccount);
        }
      } finally {
        dispatch(closeModularDrawer());
        resetAll();
      }
    },
    [callbackId, cancelCallbackId, dispatch, executeCallback, unregisterCancelCallback, resetAll],
  );

  const handleCurrencySelected = useCallback(
    (currency: CryptoOrTokenCurrency) => {
      if (cancelCallbackId) {
        unregisterCancelCallback(cancelCallbackId);
      }
      try {
        if (callbackId) {
          executeCurrencyCallback(callbackId, currency);
        }
      } finally {
        dispatch(closeModularDrawer());
        resetAll();
      }
    },
    [
      callbackId,
      cancelCallbackId,
      dispatch,
      executeCurrencyCallback,
      unregisterCancelCallback,
      resetAll,
    ],
  );

  return {
    isOpen,
    preselectedCurrencies,
    categories,
    enableAccountSelection,
    completionMode,
    presentation,
    assetsConfiguration,
    networksConfiguration,
    useCase,
    uiUseCase,
    areCurrenciesFiltered,
    selectableNetworkIds,
    openDrawer,
    closeDrawer,
    hideDrawer,
    handleAccountSelected,
    handleCurrencySelected,
  };
};
