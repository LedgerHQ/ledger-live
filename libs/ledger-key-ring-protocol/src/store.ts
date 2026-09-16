/**
 * This exports all the logic related to the Trustchain store.
 * The Trustchain store is a store that contains the data related to trustchain.
 * It essentially is the client's credentials that are only stored on the
 * client side and the trustchain returned by the backend.
 */
import { MemberCredentialsSchema, type MemberCredentials, type Trustchain } from "./types";
import { initMemberCredentials } from "./utils";

export const TRUSTCHAIN_STORE_VERSION = 1.1;

export type LkrpEnvironment = "STAGING" | "PROD";

export type TrustchainStore = {
  version?: number;
  trustchain: Trustchain | null;
  memberCredentials: MemberCredentials | null;
};

export type TrustchainState = {
  environment?: LkrpEnvironment;
  PROD: TrustchainStore | null;
  STAGING: TrustchainStore | null;
};

export type PersistedTrustchainState = Pick<TrustchainState, "PROD" | "STAGING">;

export const trustchainStorageKey = {
  PROD: "trustchain",
  STAGING: "trustchainStaging",
} as const satisfies Record<LkrpEnvironment, string>;

export const lkrpEnvironments = Object.keys(trustchainStorageKey) as LkrpEnvironment[];

export const INITIAL_TRUSTCHAIN_STORE: TrustchainStore = {
  version: TRUSTCHAIN_STORE_VERSION,
  trustchain: null,
  memberCredentials: null,
};

export const INITIAL_STATE: TrustchainState = {
  PROD: null,
  STAGING: null,
};

export const getInitialStore = (): TrustchainState => {
  return INITIAL_STATE;
};

export const trustchainStoreActionTypePrefix = "TRUSTCHAIN_STORE_";

export enum TrustchainHandlerType {
  TRUSTCHAIN_STORE_IMPORT_STATE = `${trustchainStoreActionTypePrefix}IMPORT_STATE`,
  TRUSTCHAIN_STORE_RESET = `${trustchainStoreActionTypePrefix}RESET`,
  TRUSTCHAIN_STORE_SET_TRUSTCHAIN = `${trustchainStoreActionTypePrefix}SET_TRUSTCHAIN`,
  TRUSTCHAIN_STORE_SET_MEMBER_CREDENTIALS = `${trustchainStoreActionTypePrefix}SET_MEMBER_CREDENTIALS`,
  TRUSTCHAIN_STORE_SET_ENVIRONMENT = `${trustchainStoreActionTypePrefix}SET_ENVIRONMENT`,
}

export type TrustchainHandlersPayloads = {
  TRUSTCHAIN_STORE_IMPORT_STATE: PersistedTrustchainState;
  TRUSTCHAIN_STORE_RESET: { memberCredentials: MemberCredentials };
  TRUSTCHAIN_STORE_SET_TRUSTCHAIN: { trustchain: Trustchain };
  TRUSTCHAIN_STORE_SET_MEMBER_CREDENTIALS: { memberCredentials: MemberCredentials };
  TRUSTCHAIN_STORE_SET_ENVIRONMENT: { environment: LkrpEnvironment };
};

type Handlers<State, Types, PreciseKey = true> = {
  [Key in keyof Types]: (
    state: State,
    body: { payload: Types[PreciseKey extends true ? Key : keyof Types] },
  ) => State;
};

export type TrustchainHandlers<PreciseKey = true> = Handlers<
  TrustchainState,
  TrustchainHandlersPayloads,
  PreciseKey
>;

function initializeStagingState(state: TrustchainState): TrustchainState {
  const { environment, PROD, STAGING } = state;

  // STAGING is initialized only when the SDK selected it, PROD credentials are available,
  // and no staging record was loaded from storage.
  if (environment !== "STAGING" || !PROD || STAGING) return state;

  // Version 1.1 migration
  // Before storage was split, a staging trustchain could be stored under the production key.
  if (PROD.trustchain && !PROD.version) {
    const migrated = { ...PROD, version: TRUSTCHAIN_STORE_VERSION };
    return { ...state, PROD: migrated, STAGING: migrated };
  }

  // A new staging environment reuses the local member identity but owns its trustchain data.
  return {
    ...state,
    STAGING: {
      version: TRUSTCHAIN_STORE_VERSION,
      trustchain: null,
      memberCredentials: PROD.memberCredentials,
    },
  };
}

function updateActiveStore(
  state: TrustchainState,
  update: (store: TrustchainStore) => TrustchainStore,
): TrustchainState {
  const environment = state.environment ?? "PROD";
  const activeStore = state[environment];
  if (!activeStore) return state;
  return { ...state, [environment]: update(activeStore) };
}

export const trustchainHandlers: TrustchainHandlers = {
  TRUSTCHAIN_STORE_IMPORT_STATE: (state, { payload: { PROD, STAGING } }) => {
    return initializeStagingState({ ...state, PROD, STAGING });
  },
  TRUSTCHAIN_STORE_RESET: (state, { payload: { memberCredentials } }) => {
    return updateActiveStore(state, store => ({
      ...store,
      trustchain: null,
      memberCredentials,
    }));
  },
  TRUSTCHAIN_STORE_SET_TRUSTCHAIN: (state, { payload: { trustchain } }) => {
    return updateActiveStore(state, store => ({ ...store, trustchain }));
  },
  TRUSTCHAIN_STORE_SET_MEMBER_CREDENTIALS: (state, { payload: { memberCredentials } }) => {
    return updateActiveStore(state, store => ({ ...store, memberCredentials }));
  },
  TRUSTCHAIN_STORE_SET_ENVIRONMENT: (state, { payload: { environment } }) => {
    return initializeStagingState({ ...state, environment });
  },
};

// actions

function hasValidMemberCredentials(store: TrustchainStore | null | undefined) {
  return MemberCredentialsSchema.safeParse(store?.memberCredentials).success;
}

export const importTrustchainStoreState = (persistedState?: Partial<PersistedTrustchainState>) => {
  const PROD =
    persistedState?.PROD && hasValidMemberCredentials(persistedState.PROD)
      ? persistedState.PROD
      : { ...INITIAL_TRUSTCHAIN_STORE, memberCredentials: initMemberCredentials() };
  const STAGING =
    persistedState?.STAGING && hasValidMemberCredentials(persistedState.STAGING)
      ? persistedState.STAGING
      : null;

  return {
    type: `${trustchainStoreActionTypePrefix}IMPORT_STATE`,
    payload: { PROD, STAGING },
  };
};

export const resetTrustchainStore = () => ({
  type: `${trustchainStoreActionTypePrefix}RESET`,
  payload: {
    memberCredentials: initMemberCredentials(),
  },
});

export const setTrustchain = (trustchain: Trustchain) => ({
  type: `${trustchainStoreActionTypePrefix}SET_TRUSTCHAIN`,
  payload: { trustchain },
});

export const setMemberCredentials = (memberCredentials: MemberCredentials) => ({
  type: `${trustchainStoreActionTypePrefix}SET_MEMBER_CREDENTIALS`,
  payload: { memberCredentials },
});

export const setLkrpEnvironment = (environment: LkrpEnvironment) => ({
  type: `${trustchainStoreActionTypePrefix}SET_ENVIRONMENT`,
  payload: { environment },
});

// Local Selectors
// FIXME: these are not actually local Selector, a localSelector takes a TrustchainStore in param. we will need to rework this.

export const trustchainRecordSelector =
  (environment: LkrpEnvironment) =>
  (state: { trustchain: TrustchainState }): TrustchainStore | null =>
    state.trustchain[environment];

export const trustchainStoreSelector = (state: { trustchain: TrustchainState }): TrustchainStore =>
  state.trustchain[state.trustchain.environment ?? "PROD"] ?? INITIAL_TRUSTCHAIN_STORE;

export const trustchainSelector = (state: { trustchain: TrustchainState }): Trustchain | null =>
  trustchainStoreSelector(state).trustchain;

export const memberCredentialsSelector = (state: {
  trustchain: TrustchainState;
}): MemberCredentials | null => trustchainStoreSelector(state).memberCredentials;

export const lkrpEnvironmentSelector = (state: {
  trustchain: TrustchainState;
}): LkrpEnvironment | null => state.trustchain.environment ?? null;
