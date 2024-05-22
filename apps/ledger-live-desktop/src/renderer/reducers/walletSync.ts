import { handleActions } from "redux-actions";
import { Handlers } from "./types";

export type WalletSyncState = {
  activated: boolean;
};

const initialState: WalletSyncState = {
  activated: false,
};

type HandlersPayloads = {
  WALLET_SYNC_ACTIVATE: boolean;
  WALLET_SYNC_DEACTIVATE: boolean;
};

type MarketHandlers<PreciseKey = true> = Handlers<WalletSyncState, HandlersPayloads, PreciseKey>;

const handlers: MarketHandlers = {
  WALLET_SYNC_ACTIVATE: (state: WalletSyncState) => ({
    ...state,
    activated: true,
  }),
  WALLET_SYNC_DEACTIVATE: (state: WalletSyncState) => ({
    ...state,
    activated: false,
  }),
};

// Selectors
export const walletSyncSelector = (state: { walletSync: WalletSyncState }) => state.walletSync;

export default handleActions<WalletSyncState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as MarketHandlers<false>,
  initialState,
);
