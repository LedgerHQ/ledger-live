import { selectWalletSyncState } from "@domain/entity-wallet-sync";
import {
  memberCredentialsSelector,
  resetTrustchainStore,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import {
  createSelector,
  createSlice,
  miniSerializeError,
  type Dispatch,
  type MiddlewareAPI,
  type PayloadAction,
  type SerializedError,
} from "@reduxjs/toolkit";
import { track } from "@shared/analytics";
import type { MemberCredentials, Trustchain } from "@shared/cloud-sync";
import { createWalletSyncWatchLoop } from "../createWalletSyncWatchLoop";
import { makeLocalIncrementalUpdate } from "../incrementalUpdates";
import type { LedgerSyncMiddlewareConfig, LedgerSyncState, LedgerSyncStateRoot } from "../types";
import type { createLedgerSyncServices } from "./services";

const initialState: LedgerSyncState = { visualPending: false, walletSyncError: null };

export const ledgerSyncSlice = createSlice({
  name: "ledgerSync",
  initialState,
  reducers: {
    setVisualPending(state, { payload }: PayloadAction<boolean>) {
      state.visualPending = payload;
    },
    setWalletSyncError(state, { payload }: PayloadAction<SerializedError | null>) {
      state.walletSyncError = payload;
    },
  },
});

const { setVisualPending, setWalletSyncError } = ledgerSyncSlice.actions;

const MEMBERSHIP_REVOKED_ERRORS = new Set(["TrustchainNotAllowed", "TrustchainEjected"]);

export function createLedgerSyncWatch<S extends LedgerSyncStateRoot, LocalState, Update>(
  { getState, dispatch }: MiddlewareAPI<Dispatch, S>,
  { featureSelector, cloudSync }: LedgerSyncMiddlewareConfig<S, LocalState, Update>,
  { lkrpSdk, cloudSyncSdk }: ReturnType<typeof createLedgerSyncServices>,
) {
  // The loop restarts when one of these changes, by reference.
  const selectInputs = createSelector(
    [
      (state: S) => featureSelector(state).enabled === true,
      (state: S) => featureSelector(state).watchConfig,
      trustchainSelector,
      memberCredentialsSelector,
      cloudSync.walletsyncSelector,
    ],
    (enabled, watchConfig, trustchain, memberCredentials, walletsync) => ({
      enabled,
      watchConfig,
      trustchain,
      memberCredentials,
      walletsync,
    }),
  );
  let watching = false;
  let current:
    | {
        inputs: ReturnType<typeof selectInputs>;
        loop?: ReturnType<typeof createWalletSyncWatchLoop>;
      }
    | undefined;

  function update() {
    if (!watching) return;
    const inputs = selectInputs(getState());
    if (inputs === current?.inputs) return;
    current?.loop?.unsubscribe();
    const { enabled, watchConfig, trustchain, memberCredentials, walletsync } = inputs;
    if (!enabled || !trustchain || !memberCredentials) {
      current = { inputs };
      dispatch(setVisualPending(false));
      dispatch(setWalletSyncError(null));
      return;
    }
    const loop = createWalletSyncWatchLoop({
      walletsync,
      walletSyncSdk: cloudSyncSdk,
      watchConfig,
      localIncrementUpdate: makeLocalIncrementalUpdate({
        walletsync,
        getState,
        latestWalletStateSelector: selectWalletSyncState,
        localStateSelector: cloudSync.localStateSelector,
        saveUpdate: (data, version, newLocalState) =>
          cloudSync.save(data, version, newLocalState, dispatch),
      }),
      trustchain,
      memberCredentials,
      setVisualPending: pending => dispatch(setVisualPending(pending)),
      getState,
      localStateSelector: cloudSync.localStateSelector,
      latestDistantStateSelector: state => selectWalletSyncState(state).data,
      onError: onLoopError,
      onStartPolling: () => dispatch(setWalletSyncError(null)),
      onTrustchainRefreshNeeded: refreshed => refreshTrustchain(refreshed, memberCredentials),
    });
    current = { inputs, loop };
  }

  function onLoopError(error: unknown) {
    dispatch(setWalletSyncError(miniSerializeError(error)));
    if (isMembershipRevoked(error)) {
      dispatch(resetTrustchainStore());
      void cloudSync.save(null, 0, null, dispatch);
    }
  }

  async function refreshTrustchain(trustchain: Trustchain, memberCredentials: MemberCredentials) {
    try {
      dispatch(setTrustchain(await lkrpSdk.restoreTrustchain(trustchain, memberCredentials)));
    } catch (error) {
      if (isMembershipRevoked(error)) {
        dispatch(resetTrustchainStore());
        track("ledgersync_deactivated");
      }
    }
  }

  return {
    start() {
      if (watching) return;
      watching = true;
      current = undefined;
      dispatch(setVisualPending(true));
      update();
    },
    stop() {
      watching = false;
      current?.loop?.unsubscribe();
      current = undefined;
    },
    refresh() {
      current?.loop?.onUserRefreshIntent();
    },
    /** Called after every action: restarts the loop when what it runs on has changed. */
    update,
  };
}

function isMembershipRevoked(error: unknown): boolean {
  return error instanceof Error && MEMBERSHIP_REVOKED_ERRORS.has(error.name);
}
