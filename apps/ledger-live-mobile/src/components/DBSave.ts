import { trustchainStoreSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { postOnboardingSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { exportWalletState, walletStateExportShouldDiffer } from "@ledgerhq/live-wallet/store";
import isEqual from "lodash/isEqual";
import throttleFn from "lodash/throttle";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { createSelector } from "~/context/selectors";
import { useStore, useSelector } from "~/context/hooks";
import { useTrackingPairs } from "~/actions/general";
import {
  saveAccounts,
  saveBle,
  saveCountervalues,
  saveCryptoAssetsCacheState,
  saveFeatureFlagsState,
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
import { Maybe } from "../types/helpers";
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

type MaybeState = Maybe<State>;

type Props<Data, Stats> = {
  /** Selector for the minimal state slice this effect cares about. Avoids subscribing to root state. */
  stateSelector: (state: State) => unknown;
  throttle: number;
  lense: (_: State) => Data;
  getChangesStats: (next: State, prev: State) => Stats;
  save: (data: Data, changedStats: Stats) => Promise<void>;
  saveAtStart?: boolean;
};

function useDBSaveEffect<D, S>({
  stateSelector,
  lense,
  throttle = 500,
  save,
  getChangesStats,
  saveAtStart = false,
}: Props<D, S>) {
  const store = useStore();
  const storeRef = useRef(store);
  storeRef.current = store;
  const selectedSlice = useSelector(stateSelector);
  const forceSave = useRef(saveAtStart);
  const lastSavedState = useRef<MaybeState>(undefined);
  const isSaving = useRef(false);
  const latestProps = useRef({
    lense,
    save,
    getChangesStats,
  });
  const checkForSave = useMemo(
    () =>
      // throttle allow to not spam lense and save too much because they are costly
      // nb it does not prevent race condition here. save must be idempotent and atomic
      throttleFn(async (): Promise<void> => {
        if (isSaving.current) return checkForSave(); // if we are already saving, we re-schedule
        const { lense, save, getChangesStats } = latestProps.current;
        const state = storeRef.current.getState() as State;
        const prev = lastSavedState.current;
        if (prev !== undefined && prev !== null) {
          const changedStats = getChangesStats(prev, state); // we compare last saved with latest state
          if (!changedStats && !forceSave.current) return; // if it's falsy, it means there is no changes
          isSaving.current = true;
          try {
            await save(lense(state), changedStats); // we save it for real
          } finally {
            isSaving.current = false;
          }
        }
        lastSavedState.current = state; // for the next round, we will be able to compare with latest successful state
        forceSave.current = false;
      }, throttle),
    [throttle],
  );
  useFlushMechanism(checkForSave);
  // each time the selected slice or props change, we will checkForSave
  useEffect(() => {
    latestProps.current = {
      lense,
      save,
      getChangesStats,
    };
    const state = store.getState() as State;
    if (lastSavedState.current === undefined) {
      lastSavedState.current = state;
    }
    checkForSave();
  }, [lense, save, checkForSave, store, getChangesStats, selectedSlice]);
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

/** Memoized so useSelector does not see a new object on every action (accounts + wallet drive account export). */
const accountsDbSaveSliceSelector = createSelector(
  (state: State) => state.accounts,
  (state: State) => state.wallet,
  (accounts, wallet) => ({ accounts, wallet }),
);
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
const featureFlagsNotEquals = (a: State, b: State) =>
  a.featureFlags.overrides !== b.featureFlags.overrides ||
  a.featureFlags.bannerVisible !== b.featureFlags.bannerVisible;
const featureFlagsLense = (state: State) => ({
  overrides: state.featureFlags.overrides,
  bannerVisible: state.featureFlags.bannerVisible,
});
const identitiesNotEquals = (a: State, b: State) => a.identities !== b.identities;

const extractIdentitiesForPersistence = (state: State) =>
  exportIdentitiesForPersistence(state.identities);

const countervaluesChangesStats = (oldState: State, newState: State) =>
  hasNewCountervaluesToExport(
    countervaluesStateSelector(oldState),
    countervaluesStateSelector(newState),
  );

export const ConfigureDBSaveEffects = () => {
  // TODO: instead of using these hooks, we should select from the redux state and make a static lense function.
  const trackingPairs = useTrackingPairs();

  useDBSaveEffect({
    stateSelector: countervaluesStateSelector,
    throttle: 2000,
    getChangesStats: countervaluesChangesStats,
    lense: useCallback(
      (state: State) => exportCountervalues(countervaluesStateSelector(state), trackingPairs),
      [trackingPairs],
    ),
    save: saveCountervalues,
  });
  useDBSaveEffect({
    stateSelector: (state: State) => state.settings,
    save: saveSettings,
    throttle: 400,
    getChangesStats: getSettingsChanged,
    lense: settingsStoreSelector,
  });
  useDBSaveEffect({
    stateSelector: accountsDbSaveSliceSelector,
    save: saveAccounts,
    throttle: 500,
    getChangesStats: getAccountsChanged,
    lense: accountsExportSelector,
  });
  useDBSaveEffect({
    stateSelector: (state: State) => state.ble,
    save: saveBle,
    throttle: 500,
    getChangesStats: bleNotEquals,
    lense: bleSelector,
  });
  useDBSaveEffect({
    stateSelector: (state: State) => state.postOnboarding,
    save: savePostOnboardingState,
    throttle: 500,
    getChangesStats: getPostOnboardingStateChanged,
    lense: postOnboardingSelector,
  });

  useDBSaveEffect({
    stateSelector: (state: State) => state.market,
    save: saveMarketState,
    throttle: 500,
    getChangesStats: marketNotEquals,
    lense: exportMarketSelector,
  });

  useDBSaveEffect({
    stateSelector: (state: State) => state.trustchain,
    save: saveTrustchainState,
    throttle: 500,
    getChangesStats: trustchainNotEquals,
    lense: trustchainStoreSelector,
  });

  useDBSaveEffect({
    stateSelector: (state: State) => state.wallet,
    save: saveWalletExportState,
    throttle: 500,
    getChangesStats: compareWalletState,
    lense: walletExportSelector,
  });

  useDBSaveEffect({
    stateSelector: (state: State) => state.largeMover,
    save: saveLargeMoverState,
    throttle: 500,
    getChangesStats: largeMoverNotEquals,
    lense: exportLargeMoverSelector,
  });

  useDBSaveEffect({
    stateSelector: (state: State) => state.cryptoAssetsApi,
    save: saveCryptoAssetsCacheState,
    throttle: 1000,
    getChangesStats: cryptoAssetsNotEquals,
    lense: extractPersistedCALFromState,
  });

  useDBSaveEffect({
    stateSelector: (state: State) => state.identities,
    save: saveIdentities,
    throttle: 500,
    getChangesStats: identitiesNotEquals,
    lense: extractIdentitiesForPersistence,
    saveAtStart: true, // since the middleware has already possibly saved the identities, we need to be sure to save it at start
  });

  useDBSaveEffect({
    stateSelector: (state: State) => state.featureFlags,
    save: saveFeatureFlagsState,
    throttle: 400,
    getChangesStats: featureFlagsNotEquals,
    lense: featureFlagsLense,
  });

  return null;
};
