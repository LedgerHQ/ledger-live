/* eslint-disable consistent-return */
import { Middleware } from "@reduxjs/toolkit";
import { setKey } from "~/renderer/storage";
import { postOnboardingSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { actionTypePrefix as postOnboardingActionTypePrefix } from "@ledgerhq/live-common/postOnboarding/actions";
import { isActionWithType } from "./utils";

import { settingsStoreSelector, areSettingsLoaded } from "./../reducers/settings";
import { State } from "../reducers";
import { Account, AccountUserData } from "@ledgerhq/types-live";
import {
  accountUserDataExportSelector,
  walletStateExportShouldDiffer,
  exportWalletState,
} from "@ledgerhq/live-wallet/store";
import {
  trustchainStoreActionTypePrefix,
  trustchainStoreSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";

import { marketStoreSelector } from "../reducers/market";
import { cryptoAssetsApi } from "@ledgerhq/cryptoassets/cal-client/state-manager/api";
import { createRtkQueryStateSelector, shouldPersist } from "@ledgerhq/live-persistence";
import { saveRtkQueryStateToIndexedDB } from "@ledgerhq/live-persistence/implementations/redux-state-indexeddb";

let DB_MIDDLEWARE_ENABLED = true;

// ability to temporary disable the db middleware from outside
export const disable = (ms = 1000) => {
  DB_MIDDLEWARE_ENABLED = false;
  setTimeout(() => (DB_MIDDLEWARE_ENABLED = true), ms);
};

function accountsExportSelector(state: State) {
  const all: [Account, AccountUserData][] = [];
  for (const account of state.accounts) {
    const accountUserData = accountUserDataExportSelector(state.wallet, { account });
    if (accountUserData) {
      all.push([account, accountUserData]);
    }
  }
  return all;
}

// Create selector for crypto assets cache state
// Only cache token lookup queries, not sync hash or infinite queries
const cryptoAssetsStateSelector = createRtkQueryStateSelector(cryptoAssetsApi, undefined, [
  "findTokenById",
  "findTokenByAddressInCurrency",
]);

// Track last persisted state to avoid unnecessary writes
let lastPersistedCryptoAssetsState: ReturnType<typeof cryptoAssetsStateSelector> = null;

const DBMiddleware: Middleware<{}, State> = store => next => action => {
  if (!isActionWithType(action)) {
    return next(action);
  }

  if (DB_MIDDLEWARE_ENABLED && action.type.startsWith("DB:")) {
    const [, type] = action.type.split(":");
    store.dispatch({
      type,
      payload: action.payload,
    });
    const state = store.getState();
    setKey("app", "accounts", accountsExportSelector(state));
    // ^ TODO ultimately we'll do same for accounts to drop DB: pattern
  } else if (DB_MIDDLEWARE_ENABLED && action.type.startsWith(postOnboardingActionTypePrefix)) {
    next(action);
    const state = store.getState();
    setKey("app", "postOnboarding", postOnboardingSelector(state));
  } else if (DB_MIDDLEWARE_ENABLED && action.type.startsWith(trustchainStoreActionTypePrefix)) {
    next(action);
    const state = store.getState();
    setKey("app", "trustchain", trustchainStoreSelector(state));
  } else if (DB_MIDDLEWARE_ENABLED && action.type.startsWith("MARKET")) {
    next(action);
    const state = store.getState();
    setKey("app", "market", marketStoreSelector(state));
  } else if (DB_MIDDLEWARE_ENABLED && action.type.startsWith(cryptoAssetsApi.reducerPath + "/")) {
    // Handle cryptoAssetsApi actions - persist RTK Query state to IndexedDB
    next(action);
    const state = store.getState();
    const cryptoAssetsState = cryptoAssetsStateSelector(state);

    // Only persist if state has actually changed
    if (shouldPersist(lastPersistedCryptoAssetsState, cryptoAssetsState)) {
      lastPersistedCryptoAssetsState = cryptoAssetsState;
      // Save to IndexedDB directly (non-blocking)
      saveRtkQueryStateToIndexedDB(cryptoAssetsState).catch(error => {
        console.error("Failed to persist crypto assets state to IndexedDB:", error);
      });
    }
    return;
  } else {
    const oldState = store.getState();
    const res = next(action);
    const newState = store.getState();
    // NB Prevent write attempts when the app is locked.
    if (!oldState.application.isLocked || action.type === "APPLICATION_SET_DATA") {
      if (areSettingsLoaded(newState) && oldState.settings !== newState.settings) {
        setKey("app", "settings", settingsStoreSelector(newState));
      }
    }

    if (walletStateExportShouldDiffer(oldState.wallet, newState.wallet)) {
      setKey("app", "wallet", exportWalletState(newState.wallet));
    }
    return res;
  }
};

export default DBMiddleware;
