/**
 * This exports all the logic related to the Trustchain store.
 * The Trustchain store is a store that contains the data related to trustchain.
 * It essentially is the client's credentials that are only stored on the
 * client side and the trustchain returned by the backend.
 */
import { MemberCredentials, Trustchain } from "./types";

export type TrustchainStore = {
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
};

export const getInitialStore = (): TrustchainStore => {
  return {
    trustchain: null,
    memberCredentials: null,
  };
};

export enum WalletHandlerType {
  RESET_TRUSTCHAIN_STORE = "RESET_TRUSTCHAIN_STORE",
  SET_TRUSTCHAIN = "SET_TRUSTCHAIN",
  SET_MEMBER_CREDENTIALS = "SET_MEMBER_CREDENTIALS",
}

export type HandlersPayloads = {
  RESET_TRUSTCHAIN_STORE: never;
  SET_TRUSTCHAIN: { trustchain: Trustchain };
  SET_MEMBER_CREDENTIALS: { memberCredentials: MemberCredentials };
};

type Handlers<State, Types, PreciseKey = true> = {
  [Key in keyof Types]: (
    state: State,
    body: { payload: Types[PreciseKey extends true ? Key : keyof Types] },
  ) => State;
};

export type WalletHandlers<PreciseKey = true> = Handlers<
  TrustchainStore,
  HandlersPayloads,
  PreciseKey
>;

export const handlers: WalletHandlers = {
  RESET_TRUSTCHAIN_STORE: (): TrustchainStore => {
    return { ...getInitialStore() };
  },
  SET_TRUSTCHAIN: (state, { payload: { trustchain } }) => {
    return { ...state, trustchain };
  },
  SET_MEMBER_CREDENTIALS: (state, { payload: { memberCredentials } }) => {
    return { ...state, memberCredentials };
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

export const setMemberCredentials = (memberCredentials: MemberCredentials) => ({
  type: "SET_MEMBER_CREDENTIALS",
  payload: { memberCredentials },
});

// Local Selectors

export const trustchainSelector = (state: TrustchainStore): Trustchain | null => state.trustchain;

export const liveCredentialsSelector = (state: TrustchainStore): MemberCredentials | null =>
  state.memberCredentials;
