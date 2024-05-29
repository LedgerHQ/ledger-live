/**
 * This exports all the logic related to the Trustchain store.
 * The Trustchain store is a store that contains the data related to trustchain.
 * It essentially is the ledger live's credentials that are only stored on the
 * client side and the trustchain returned by the backend.
 */
import { LiveCredentials, Trustchain } from "./types";
import { sdk } from ".";

export type TrustchainStore = {
  trustchain: Trustchain | null;
  liveCredentials: LiveCredentials | null;
};

export const getInitialStore = (): TrustchainStore => {
  return {
    trustchain: null,
    liveCredentials: null,
  };
};

export enum WalletHandlerType {
  RESET_TRUSTCHAIN_STORE = "RESET_TRUSTCHAIN_STORE",
  SET_TRUSTCHAIN = "SET_TRUSTCHAIN",
}

export type HandlersPayloads = {
  RESET_TRUSTCHAIN_STORE: {};
  SET_TRUSTCHAIN: { trustchain: Trustchain };
};

type Handlers<State, Types, PreciseKey = true> = {
  [Key in keyof Types]: (
    state: State,
    body: { payload: Types[PreciseKey extends true ? Key : keyof Types] },
  ) => State;
};

export type WalletHandlers<PreciseKey = true> = Handlers<TrustchainStore, HandlersPayloads, PreciseKey>;

export const handlers: WalletHandlers = {
  RESET_TRUSTCHAIN_STORE: (): TrustchainStore => {
    return { ...getInitialStore() };
  },
  SET_TRUSTCHAIN: (state, { payload: { trustchain } }) => {
    return { ...state, trustchain };
  },
};

// actions

export const resetTrustchainStore = () => ({
  type: "RESET_TRUSTCHAIN_STORE",
});

export const setTrustchain = (trustchain: Trustchain) => ({
  type: "SET_TRUSTCHAIN",
  payload: { trustchain },
});

// Local Selectors

export const trustchainSelector = (
  state: TrustchainStore,
): Trustchain | null => state.trustchain;

export const liveCredentialsSelector = (
  state: TrustchainStore,
): LiveCredentials | null => state.liveCredentials;
