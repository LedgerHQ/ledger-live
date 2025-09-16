import { StoredWalletSyncUserState } from "@ledgerhq/live-wallet/store";
import { handleActions } from "redux-actions";
import { Handlers } from "./types";

export type WalletSyncUserStateState = StoredWalletSyncUserState;

const initialState: WalletSyncUserStateState = {
  visualPending: false,
  walletSyncError: null,
};

type HandlersPayloads = {
  SET_WALLET_SYNC_USER_STATE: StoredWalletSyncUserState;
  SET_WALLET_SYNC_PENDING: boolean;
  SET_WALLET_SYNC_ERROR: Error | null;
};

type WalletSyncUserStateHandlers<PreciseKey = true> = Handlers<
  WalletSyncUserStateState,
  HandlersPayloads,
  PreciseKey
>;

const handlers: WalletSyncUserStateHandlers = {
  SET_WALLET_SYNC_USER_STATE: (
    state: WalletSyncUserStateState,
    { payload }: { payload: StoredWalletSyncUserState },
  ) => ({
    ...state,
    ...payload,
  }),
  SET_WALLET_SYNC_PENDING: (
    state: WalletSyncUserStateState,
    { payload }: { payload: boolean },
  ) => ({
    ...state,
    visualPending: payload,
  }),
  SET_WALLET_SYNC_ERROR: (
    state: WalletSyncUserStateState,
    { payload }: { payload: Error | null },
  ) => ({
    ...state,
    walletSyncError: payload,
  }),
};

export default handleActions<WalletSyncUserStateState, HandlersPayloads[keyof HandlersPayloads]>(
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  handlers as unknown as WalletSyncUserStateHandlers<false>,
  initialState,
);
