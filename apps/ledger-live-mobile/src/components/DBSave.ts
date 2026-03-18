import { trustchainStoreSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { postOnboardingSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { exportWalletState, walletStateExportShouldDiffer } from "@ledgerhq/live-wallet/store";
import isEqual from "lodash/isEqual";
import throttleFn from "lodash/throttle";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStore } from "~/context/hooks";
import { useTrackingPairs, useUserSettings } from "~/actions/general";
import {
  saveAccounts,
  saveBle,
  saveCountervalues,
  saveCryptoAssetsCacheState,
  saveIdentities,
  saveLargeMoverState,
  saveMarketState,
  savePostOnboardingState,
  saveSettings,
  saveTrustchainState,
  saveWalletExportState,
} from "~/db";
import { exportSelector as accountsExportSelector } from "~/reducers/accounts";
import { countervaluesStateSelector } from "~/reducers/countervalues";
import { exportSelector as bleSelector } from "~/reducers/ble";
import { exportLargeMoverSelector } from "~/reducers/largeMover";
import { exportMarketSelector } from "~/reducers/market";
import { settingsStoreSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";
import { walletSelector } from "~/reducers/wallet";
import {
  extractPersistedCALFromState,
  persistedCALContentEqual,
} from "@ledgerhq/cryptoassets/cal-client/persistence";
import { exportIdentitiesForPersistence } from "@ledgerhq/client-ids/store";
import { accountPersistedStateChanged } from "@ledgerhq/live-common/account/index";
import {
  exportCountervalues,
  hasNewCountervaluesToExport,
} from "@ledgerhq/live-countervalues/logic";

type Props<Data, Stats> = {
  throttle: number;
  lense: (_: State) => Data;
  getChangesStats: (next: State, prev: State) => Stats;
  save: (data: Data, changedStats: Stats) => Promise<void>;
  saveAtStart?: boolean;
};

function useDBSaveEffect<D, S>({
  lense,
  throttle = 500,
  save,
  getChangesStats,
  saveAtStart = false,
}: Props<D, S>) {
  const store = useStore();
  const forceSave = useRef(saveAtStart);
  const lastSavedState = useRef<State>(store.getState());
  const isSaving = useRef(false);
  const latestProps = useRef({
    lense,
    save,
    getChangesStats,
  });
  const checkForSave = useMemo(
    () =>
      throttleFn(async (): Promise<void> => {
        if (isSaving.current) return checkForSave();
        const { lense, save, getChangesStats } = latestProps.current;
        const state = store.getState();
        if (lastSavedState.current && state) {
          const changedStats = getChangesStats(lastSavedState.current, state);
          if (!changedStats && !forceSave.current) return;
          isSaving.current = true;
          try {
            await save(lense(state), changedStats);
          } finally {
            isSaving.current = false;
          }
          lastSavedState.current = state;
          forceSave.current = false;
        }
      }, throttle),
    [throttle, store],
  );
  useFlushMechanism(checkForSave);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => checkForSave());
    return unsubscribe;
  }, [store, checkForSave]);

  useEffect(() => {
    latestProps.current = { lense, save, getChangesStats };
    checkForSave();
  }, [lense, save, checkForSave, getChangesStats]);
}
const flushes: Array<() => void> = [];
export const flushAll = () => Promise.all(flushes.map(flush => flush()));

function useFlushMechanism({ flush, cancel }: { flush: () => void; cancel: () => void }) {
  const cancelRef = useRef(cancel);
  useEffect(() => () => cancelRef.current(), []);
  useEffect(() => {
    flushes.push(flush);
    return () => {
      const i = flushes.indexOf(flush);

      if (i !== -1) {
        flushes.splice(i, 1);
      }
    };
  }, [flush]);
}

function walletExportSelector(state: State) {
  return exportWalletState(walletSelector(state));
}

const getSettingsChanged = (a: State, b: State) => a.settings !== b.settings;
const getAccountsChanged = (
  oldState: State,
  newState: State,
):
  | {
      changed: string[];
    }
  | null
  | undefined => {
  if (oldState.accounts !== newState.accounts) {
    const oldById = new Map(oldState.accounts.active.map(a => [a.id, a] as const));
    return {
      changed: newState.accounts.active
        .filter(a => {
          const old = oldById.get(a.id);
          return !old || accountPersistedStateChanged(old, a);
        })
        .map(a => a.id),
    };
  }
  return null;
};
const bleNotEquals = (a: State, b: State) => a.ble !== b.ble;

const getPostOnboardingStateChanged = (a: State, b: State) =>
  !isEqual(a.postOnboarding, b.postOnboarding);

const marketNotEquals = (a: State, b: State) => a.market !== b.market;
const trustchainNotEquals = (a: State, b: State) => a.trustchain !== b.trustchain;
const compareWalletState = (a: State, b: State) =>
  walletStateExportShouldDiffer(a.wallet, b.wallet);
const largeMoverNotEquals = (a: State, b: State) => a.largeMover !== b.largeMover;

const cryptoAssetsNotEquals = (a: State, b: State) =>
  !persistedCALContentEqual(extractPersistedCALFromState(a), extractPersistedCALFromState(b));
const identitiesNotEquals = (a: State, b: State) => a.identities !== b.identities;

const extractIdentitiesForPersistence = (state: State) =>
  exportIdentitiesForPersistence(state.identities);

const countervaluesChangesStats = (oldState: State, newState: State) => {
  return hasNewCountervaluesToExport(
    countervaluesStateSelector(oldState),
    countervaluesStateSelector(newState),
  );
};

export const ConfigureDBSaveEffects = () => {
  // TODO: instead of using these hooks, we should select from the redux state and make a static lense function.
  const trackingPairs = useTrackingPairs();
  const userSettings = useUserSettings();

  useDBSaveEffect({
    throttle: 2000,
    getChangesStats: countervaluesChangesStats,
    lense: useCallback(
      (state: State) =>
        exportCountervalues(
          countervaluesStateSelector(state),
          trackingPairs,
          userSettings.selectedTimeRange,
        ),
      [trackingPairs, userSettings.selectedTimeRange],
    ),
    save: saveCountervalues,
  });
  useDBSaveEffect({
    save: saveSettings,
    throttle: 400,
    getChangesStats: getSettingsChanged,
    lense: settingsStoreSelector,
  });
  useDBSaveEffect({
    save: saveAccounts,
    throttle: 500,
    getChangesStats: getAccountsChanged,
    lense: accountsExportSelector,
  });
  useDBSaveEffect({
    save: saveBle,
    throttle: 500,
    getChangesStats: bleNotEquals,
    lense: bleSelector,
  });
  useDBSaveEffect({
    save: savePostOnboardingState,
    throttle: 500,
    getChangesStats: getPostOnboardingStateChanged,
    lense: postOnboardingSelector,
  });

  useDBSaveEffect({
    save: saveMarketState,
    throttle: 500,
    getChangesStats: marketNotEquals,
    lense: exportMarketSelector,
  });

  useDBSaveEffect({
    save: saveTrustchainState,
    throttle: 500,
    getChangesStats: trustchainNotEquals,
    lense: trustchainStoreSelector,
  });

  useDBSaveEffect({
    save: saveWalletExportState,
    throttle: 500,
    getChangesStats: compareWalletState,
    lense: walletExportSelector,
  });

  useDBSaveEffect({
    save: saveLargeMoverState,
    throttle: 500,
    getChangesStats: largeMoverNotEquals,
    lense: exportLargeMoverSelector,
  });

  useDBSaveEffect({
    save: saveCryptoAssetsCacheState,
    throttle: 1000,
    getChangesStats: cryptoAssetsNotEquals,
    lense: extractPersistedCALFromState,
  });

  useDBSaveEffect({
    save: saveIdentities,
    throttle: 500,
    getChangesStats: identitiesNotEquals,
    lense: extractIdentitiesForPersistence,
    saveAtStart: true, // since the middleware has already possibly saved the identities, we need to be sure to save it at start
  });

  return null;
};
