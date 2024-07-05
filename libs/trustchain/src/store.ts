/**
 * This exports all the logic related to the Trustchain store.
 * The Trustchain store is a store that contains the data related to trustchain.
 * It essentially is the client's credentials that are only stored on the
 * client side and the trustchain returned by the backend.
 */
import { JWT, MemberCredentials, Trustchain } from "./types";

export type TrustchainStore = {
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
  jwt: JWT | null;
};

export const getInitialStore = (): TrustchainStore => {
  return {
    trustchain: null,
    memberCredentials: null,
    jwt: null,
  };
};

export const trustchainStoreActionTypePrefix = "TRUSTCHAIN_STORE_";

export enum TrustchainHandlerType {
  TRUSTCHAIN_STORE_IMPORT_STATE = `${trustchainStoreActionTypePrefix}IMPORT_STATE`,
  TRUSTCHAIN_STORE_RESET = `${trustchainStoreActionTypePrefix}RESET`,
  TRUSTCHAIN_STORE_SET_TRUSTCHAIN = `${trustchainStoreActionTypePrefix}SET_TRUSTCHAIN`,
  TRUSTCHAIN_STORE_SET_MEMBER_CREDENTIALS = `${trustchainStoreActionTypePrefix}SET_MEMBER_CREDENTIALS`,
}

export type TrustchainHandlersPayloads = {
  TRUSTCHAIN_STORE_IMPORT_STATE: { trustchainStore: TrustchainStore };
  TRUSTCHAIN_STORE_RESET: never;
  TRUSTCHAIN_STORE_SET_TRUSTCHAIN: { trustchain: Trustchain };
  TRUSTCHAIN_STORE_SET_MEMBER_CREDENTIALS: { memberCredentials: MemberCredentials };
};

type Handlers<State, Types, PreciseKey = true> = {
  [Key in keyof Types]: (
    state: State,
    body: { payload: Types[PreciseKey extends true ? Key : keyof Types] },
  ) => State;
};

export type TrustchainHandlers<PreciseKey = true> = Handlers<
  TrustchainStore,
  TrustchainHandlersPayloads,
  PreciseKey
>;

export const trustchainHandlers: TrustchainHandlers = {
  TRUSTCHAIN_STORE_IMPORT_STATE: (_, { payload: { trustchainStore } }) => {
    return trustchainStore;
  },
  TRUSTCHAIN_STORE_RESET: (): TrustchainStore => {
    return { ...getInitialStore() };
  },
  TRUSTCHAIN_STORE_SET_TRUSTCHAIN: (state, { payload: { trustchain } }) => {
    return { ...state, trustchain };
  },
  TRUSTCHAIN_STORE_SET_MEMBER_CREDENTIALS: (state, { payload: { memberCredentials } }) => {
    return { ...state, memberCredentials };
  },
};

// actions

export const importTrustchainStoreState = ({
  trustchainStore,
}: {
  trustchainStore: TrustchainStore;
}) => ({
  type: `${trustchainStoreActionTypePrefix}IMPORT_STATE`,
  payload: { trustchainStore },
});

export const resetTrustchainStore = () => ({
  type: `${trustchainStoreActionTypePrefix}RESET`,
});

export const setTrustchain = (trustchain: Trustchain) => ({
  type: `${trustchainStoreActionTypePrefix}SET_TRUSTCHAIN`,
  payload: { trustchain },
});

export const setMemberCredentials = (memberCredentials: MemberCredentials) => ({
  type: `${trustchainStoreActionTypePrefix}SET_MEMBER_CREDENTIALS`,
  payload: { memberCredentials },
});

// Local Selectors

export const trustchainStoreSelector = (state: {
  trustchainStore: TrustchainStore;
}): TrustchainStore => state.trustchainStore;

export const trustchainSelector = (state: {
  trustchainStore: TrustchainStore;
}): Trustchain | null => state.trustchainStore.trustchain;

export const memberCredentialsSelector = (state: {
  trustchainStore: TrustchainStore;
}): MemberCredentials | null => state.trustchainStore.memberCredentials;
