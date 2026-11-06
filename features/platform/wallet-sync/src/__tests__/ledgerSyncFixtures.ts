import { initialWalletSyncState, walletSyncSlice, type WSState } from "@domain/entity-wallet-sync";
import {
  getInitialStore,
  trustchainHandlers,
  type TrustchainStore,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import type { WithDevice } from "@ledgerhq/ledger-key-ring-protocol/types";
import {
  combineReducers,
  configureStore,
  createSelector,
  createSlice,
  type PayloadAction,
  type UnknownAction,
} from "@reduxjs/toolkit";
import type { MemberCredentials, Trustchain } from "@shared/cloud-sync";
import type { CloudSyncDataManager, DistantDocument } from "@shared/cloud-sync-module";
import { z } from "zod";
import { createLedgerSyncMiddleware } from "../middleware";
import { ledgerSyncReducer } from "../watch";

type Local = { value: string };
type Update = { newValue: string };
const schema = z.object({ value: z.string() });

export const LKRP_URL = "https://lkrp.example.com";
const CLOUD_SYNC_URL = "https://cloud-sync.example.com";
export const WATCH_CONFIG = { initialTimeout: 10, pollingInterval: 100, userIntentDebounce: 5 };
const withDevice: WithDevice = jest.fn();
export const trustchain: Trustchain = {
  rootId: "root-id",
  walletSyncEncryptionKey: "wallet-sync-encryption-key",
  applicationPath: "m/0'/16'/0'",
};
export const memberCredentials: MemberCredentials = { pubkey: "pubkey", privatekey: "privatekey" };

type AppState = {
  walletSyncEnabled: boolean;
  blacklistedTokenIds: string[];
  local: Local;
};

const initialAppState: AppState = {
  walletSyncEnabled: false,
  blacklistedTokenIds: [],
  local: { value: "local" },
};

type StoreOptions = {
  app?: Partial<AppState>;
  trustchainStore?: TrustchainStore;
  walletSyncState?: WSState;
  reencryptOnRotation?: boolean;
};

/** Wallet Sync enabled, and an instance that is a member of a trustchain. */
export const ACTIVATED = {
  app: { walletSyncEnabled: true },
  trustchainStore: { trustchain, memberCredentials },
} satisfies StoreOptions;

const app = createSlice({
  name: "app",
  initialState: initialAppState,
  reducers: {
    blacklist(state, { payload }: PayloadAction<string[]>) {
      state.blacklistedTokenIds = payload;
    },
    enableWalletSync(state, { payload }: PayloadAction<boolean>) {
      state.walletSyncEnabled = payload;
    },
  },
});
export const { blacklist, enableWalletSync } = app.actions;

const wallet = combineReducers({ walletSync: walletSyncSlice.reducer });

// The handlers are typed per action type, as the apps' `handleActions` cast them too.
const trustchainStoreHandlers = trustchainHandlers as unknown as Record<
  string,
  ((state: TrustchainStore, action: UnknownAction) => TrustchainStore) | undefined
>;

function trustchainReducer(state = getInitialStore(), action: UnknownAction): TrustchainStore {
  return trustchainStoreHandlers[action.type]?.(state, action) ?? state;
}

type State = { app: AppState; trustchain: TrustchainStore; wallet: ReturnType<typeof wallet> };

export const isMockEnv = jest.fn(() => false);
export const createWalletsync = jest.fn((_blacklistedTokenIds: string[]) => makeWalletsync());
export const applyLocalState = jest.fn();

/** Makes the next walletsync hold its first incremental resolution until the test settles it. */
export function holdNextResolution() {
  const walletsync = makeWalletsync();
  let settle!: (resolved: Awaited<ReturnType<typeof walletsync.resolveIncrementalUpdate>>) => void;
  jest.mocked(walletsync.resolveIncrementalUpdate).mockReturnValueOnce(
    new Promise(resolve => {
      settle = resolve;
    }),
  );
  createWalletsync.mockReturnValueOnce(walletsync);
  return { settle };
}

export function createStore({
  app: appState = {},
  trustchainStore = getInitialStore(),
  walletSyncState = initialWalletSyncState.walletSyncState,
  reencryptOnRotation = false,
}: StoreOptions = {}) {
  return configureStore({
    reducer: {
      app: app.reducer,
      trustchain: trustchainReducer,
      wallet,
      ledgerSync: ledgerSyncReducer,
    },
    preloadedState: {
      app: { ...initialAppState, ...appState },
      trustchain: trustchainStore,
      wallet: { walletSync: { walletSyncState } },
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware().concat(
        createLedgerSyncMiddleware({
          featureSelector: (state: State) => ({
            enabled: state.app.walletSyncEnabled,
            watchConfig: WATCH_CONFIG,
          }),
          lkrp: {
            apiBaseUrl: LKRP_URL,
            isMockEnv,
            getInstanceName: () => "Test instance",
            withDevice,
          },
          cloudSync: {
            apiBaseUrl: CLOUD_SYNC_URL,
            walletsyncSelector: createSelector(
              [(state: State) => state.app.blacklistedTokenIds],
              createWalletsync,
            ),
            localStateSelector: (state: State) => state.app.local,
            applyLocalState,
            reencryptOnRotation,
          },
        }),
      ),
  });
}

function makeWalletsync(): CloudSyncDataManager<Local, Update, typeof schema, DistantDocument> {
  return {
    schema,
    diffLocalToDistant: jest.fn(() => ({ hasChanges: false, nextState: { value: "distant" } })),
    resolveIncrementalUpdate: jest.fn(async () => ({ hasChanges: false as const })),
    applyUpdate: jest.fn((local: Local) => local),
  };
}
