import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AccountLike } from "@ledgerhq/types-live";
import { State } from "~/reducers/types";
import { openModularDrawer, closeModularDrawer } from "~/reducers/modularDrawer";
import { OpenModularDrawerParams, OpenModularDrawerParamsWithCallbackId } from "../types";
import { useCallbackRegistry } from "./useCallbackRegistry";
import { generateCallbackId } from "../utils/callbackIdGenerator";

export const useModularDrawerStore = () => {
  const dispatch = useDispatch();
  const {
    isOpen,
    preselectedCurrencies,
    callbackId,
    enableAccountSelection,
    accountsObservableId,
  } = useSelector((state: State) => state.modularDrawer);

  const {
    registerCallback,
    executeCallback,
    registerObservable,
    getObservable,
    unregisterCallback,
  } = useCallbackRegistry();

  const openDrawer = useCallback(
    (params?: OpenModularDrawerParams) => {
      const { onAccountSelected, accounts$, ...otherParams } = params || {};

      let callbackIdToUse: string | undefined;
      if (onAccountSelected) {
        callbackIdToUse = generateCallbackId();
        // Adapt the callback to match the expected AccountCallback type
        const adaptedCallback = (account: AccountLike, parentAccount?: AccountLike) => {
          // Type guard to ensure parentAccount is Account or undefined
          const typedParentAccount =
            parentAccount && "derivationMode" in parentAccount ? parentAccount : undefined;
          onAccountSelected(account, typedParentAccount);
        };
        registerCallback(callbackIdToUse, adaptedCallback);
      }

      let observableIdToUse: string | undefined;
      if (accounts$) {
        observableIdToUse = generateCallbackId();
        registerObservable(observableIdToUse, accounts$);
      }

      const paramsWithCallbackId: OpenModularDrawerParamsWithCallbackId = {
        ...otherParams,
        callbackId: callbackIdToUse,
        accountsObservableId: observableIdToUse,
      };

      dispatch(openModularDrawer(paramsWithCallbackId));
    },
    [dispatch, registerCallback, registerObservable],
  );

  const closeDrawer = useCallback(() => {
    if (callbackId) {
      // Unregister callback associated with this drawer instance
      unregisterCallback(callbackId);
    }
    dispatch(closeModularDrawer());
  }, [dispatch, unregisterCallback, callbackId]);

  // Function to execute the callback when an account is selected
  const handleAccountSelected = useCallback(
    (account: AccountLike, parentAccount?: AccountLike) => {
      if (callbackId) {
        executeCallback(callbackId, account, parentAccount);
      }
      // Close the drawer after account selection
      closeDrawer();
    },
    [callbackId, executeCallback, closeDrawer],
  );

  // Function to get the observable when needed
  const getAccountsObservable = useCallback(() => {
    if (accountsObservableId) {
      return getObservable(accountsObservableId);
    }
    return undefined;
  }, [accountsObservableId, getObservable]);

  return {
    isOpen,
    preselectedCurrencies,
    enableAccountSelection,
    openDrawer,
    closeDrawer,
    handleAccountSelected,
    getAccountsObservable,
  };
};
