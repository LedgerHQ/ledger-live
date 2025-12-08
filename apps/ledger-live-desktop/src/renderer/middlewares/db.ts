/* eslint-disable consistent-return */
import { Middleware } from "@reduxjs/toolkit";
import throttle from "lodash/throttle";
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
import { extractPersistedCALFromState } from "@ledgerhq/cryptoassets/cal-client/persistence";

import { marketStoreSelector } from "../reducers/market";

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

// Throttled save for crypto assets cache (save at most once per 5 seconds)
const saveCryptoAssetsCache = throttle((state: State) => {
  try {
    const persistedData = extractPersistedCALFromState(state);
    if (persistedData.tokens.length > 0) {
      setKey("app", "cryptoAssets", persistedData);
    }
  } catch (error) {
    console.error("Failed to save crypto assets cache:", error);
  }
}, 5000);

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
  } else if (DB_MIDDLEWARE_ENABLED && action.type.startsWith("cryptoAssetsApi/")) {
    // Handle RTK Query crypto assets actions (throttled save)
    const res = next(action);
    const state = store.getState();
    saveCryptoAssetsCache(state);
    return res;
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
