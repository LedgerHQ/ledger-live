import { trustchainStoreSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { postOnboardingSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import { exportWalletState, walletStateExportShouldDiffer } from "@ledgerhq/live-wallet/store";
import identity from "lodash/identity";
import isEqual from "lodash/isEqual";
import throttleFn from "lodash/throttle";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { useTrackingPairs } from "~/actions/general";
import {
  saveAccounts,
  saveBle,
  saveCountervalues,
  saveCryptoAssetsCacheState,
  saveLargeMoverState,
  saveMarketState,
  savePostOnboardingState,
  saveSettings,
  saveTrustchainState,
  saveWalletExportState,
} from "~/db";
import { exportSelector as accountsExportSelector } from "~/reducers/accounts";
import { exportSelector as bleSelector } from "~/reducers/ble";
import { useCountervaluesStateExport } from "~/reducers/countervalues";
import { exportLargeMoverSelector } from "~/reducers/largeMover";
import { exportMarketSelector } from "~/reducers/market";
import { settingsStoreSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";
import { walletSelector } from "~/reducers/wallet";
import { Maybe } from "../types/helpers";
import { extractTokensFromState } from "@ledgerhq/cryptoassets/cal-client/persistence";

type MaybeState = Maybe<State>;

type Props<Data, Stats> = {
  throttle: number;
  lense: (_: State) => Data;
  getChangesStats: (next: State, prev: State) => Stats;
  save: (data: Data, changedStats: Stats) => Promise<void>;
};

function useDBSaveEffect<D, S>({ lense, throttle = 500, save, getChangesStats }: Props<D, S>) {
  const state: MaybeState = useSelector(identity);
  const lastSavedState = useRef(state);
  // we keep an updated version of current props in "latestProps" ref
  const latestProps = useRef({
    lense,
    save,
    state,
    getChangesStats,
  });
  const checkForSave = useMemo(
    () =>
      // throttle allow to not spam lense and save too much because they are costly
      // nb it does not prevent race condition here. save must be idempotent and atomic
      throttleFn(async () => {
        const { lense, save, state, getChangesStats } = latestProps.current;
        if (lastSavedState?.current && state) {
          const changedStats = getChangesStats(lastSavedState.current, state); // we compare last saved with latest state
          if (!changedStats) return; // if it's falsy, it means there is no changes

          await save(lense(state), changedStats); // we save it for real
          lastSavedState.current = state; // for the next round, we will be able to compare with latest successful state
        }
      }, throttle),
    [throttle],
  );
  useFlushMechanism(checkForSave);
  // each time a prop changes, we will checkForSave
  useEffect(() => {
    latestProps.current = {
      lense,
      save,
      state,
      getChangesStats,
    };
    checkForSave();
  }, [lense, save, state, checkForSave, getChangesStats]);
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
    return {
      changed: newState.accounts.active
        .filter(a => {
          const old = oldState.accounts.active.find(b => a.id === b.id);
          return !old || old !== a;
        })
        .map(a => a.id),
    };
  }
  return null;
};
const bleNotEquals = (a: State, b: State) => a.ble !== b.ble;
const marketNotEquals = (a: State, b: State) => a.market !== b.market;
const trustchainNotEquals = (a: State, b: State) => a.trustchain !== b.trustchain;
const compareWalletState = (a: State, b: State) =>
  walletStateExportShouldDiffer(a.wallet, b.wallet);
const largeMoverNotEquals = (a: State, b: State) => a.largeMover !== b.largeMover;

const cryptoAssetsNotEquals = (a: State, b: State) => {
  // Compare RTK Query state reference
  return a.cryptoAssetsApi !== b.cryptoAssetsApi;
};

export const ConfigureDBSaveEffects = () => {
  const getPostOnboardingStateChanged = useCallback(
    (a: State, b: State) => !isEqual(a.postOnboarding, b.postOnboarding),
    [],
  );

  const rawState = useCountervaluesStateExport();
  const trackingPairs = useTrackingPairs();
  const pairIds = useMemo(() => trackingPairs.map(p => pairId(p)), [trackingPairs]);

  const countervaluesChangesStats = useCallback(
    () => ({
      changed: !!Object.keys(rawState.status).length,
      pairIds,
    }),
    [rawState, pairIds],
  );
  const countervaluesRawState = useCallback(() => rawState, [rawState]);
  useDBSaveEffect({
    save: saveCountervalues,
    throttle: 2000,
    getChangesStats: countervaluesChangesStats,
    lense: countervaluesRawState,
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
    lense: extractTokensFromState,
  });

  return null;
};
