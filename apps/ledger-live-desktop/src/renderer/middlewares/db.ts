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
import {
  extractPersistedCALFromState,
  persistedCALContentEqual,
  type PersistedCAL,
} from "@ledgerhq/cryptoassets/cal-client/persistence";

import { marketStoreSelector } from "../reducers/market";
import { exportIdentitiesForPersistence } from "@ledgerhq/client-ids/store";
import { accountsPersistedStateChanged } from "@ledgerhq/live-common/account/index";

let DB_MIDDLEWARE_ENABLED = true;

/** Used during hard reset (reset.ts): disable persist so we don't re-write app.json while clearing. */
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
// Only write when content actually changed to avoid redundant app.json resaves
let lastPersistedCryptoAssets: PersistedCAL | null = null;
const saveCryptoAssetsCache = throttle((state: State) => {
  try {
    const persistedData = extractPersistedCALFromState(state);
    if (
      persistedData.tokens.length > 0 &&
      !persistedCALContentEqual(lastPersistedCryptoAssets, persistedData)
    ) {
      setKey("app", "cryptoAssets", persistedData);
      lastPersistedCryptoAssets = persistedData;
    }
  } catch (error) {
    console.error("Failed to save crypto assets cache:", error);
  }
}, 5000);

const DBMiddleware: Middleware<object, State> = store => next => action => {
  if (!isActionWithType(action)) {
    return next(action);
  }

  if (!DB_MIDDLEWARE_ENABLED) {
    return next(action);
  }

  if (action.type.startsWith(postOnboardingActionTypePrefix)) {
    const res = next(action);
    const state = store.getState();
    setKey("app", "postOnboarding", postOnboardingSelector(state));
    return res;
  }

  if (action.type.startsWith(trustchainStoreActionTypePrefix)) {
    const res = next(action);
    const state = store.getState();
    setKey("app", "trustchain", trustchainStoreSelector(state));
    return res;
  }

  if (action.type.startsWith("MARKET")) {
    const res = next(action);
    const state = store.getState();
    setKey("app", "market", marketStoreSelector(state));
    return res;
  }

  if (action.type.startsWith("cryptoAssetsApi/")) {
    const res = next(action);
    const state = store.getState();
    saveCryptoAssetsCache(state);
    return res;
  }

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

  if (accountsPersistedStateChanged(oldState.accounts, newState.accounts)) {
    setKey("app", "accounts", accountsExportSelector(newState));
  }

  if (oldState.identities !== newState.identities) {
    const persisted = exportIdentitiesForPersistence(newState.identities);
    setKey("app", "identities", persisted);
  }

  return res;
};

export default DBMiddleware;
