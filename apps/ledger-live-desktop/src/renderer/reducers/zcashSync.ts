import { handleActions } from "redux-actions";
import type { State } from "~/renderer/reducers";
import type { Handlers } from "./types";

export type ZcashSyncState = {
  startSyncNonce: number;
  syncState: "disabled" | "ready" | "running" | "paused" | "complete" | "outdated";
};

const initialState: ZcashSyncState = {
  startSyncNonce: 0,
  syncState: "disabled",
};

type HandlersPayloads = {
  ZCASH_SYNC_START: undefined;
  ZCASH_SYNC_READY: undefined;
};

type ZcashSyncHandlers<PreciseKey = true> = Handlers<ZcashSyncState, HandlersPayloads, PreciseKey>;

const handlers: ZcashSyncHandlers = {
  ZCASH_SYNC_START: state => ({
    ...state,
    startSyncNonce: state.startSyncNonce + 1,
  }),
  ZCASH_SYNC_READY: state => ({
    ...state,
    syncState: "ready",
  }),
};

export const zcashSyncStartNonceSelector = (state: State): ZcashSyncState["startSyncNonce"] =>
  state.zcashSync.startSyncNonce;

export const zcashSyncStateSelector = (state: State): ZcashSyncState["syncState"] =>
  state.zcashSync.syncState;

export default handleActions<ZcashSyncState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as ZcashSyncHandlers<false>,
  initialState,
);
