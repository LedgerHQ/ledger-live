import { configureStore, type Middleware, type ThunkDispatch } from "@reduxjs/toolkit";
import { UnknownAction } from "redux";
import { AuthSDK } from "@ledgerhq/ledger-auth";
import { getEnv } from "@shared/env";
import { authApiExtra, authEnvironmentSelector } from "@shared/auth";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import type { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import {
  calApiExtra,
  cardApi,
  cardApiExtra,
  coinMarketCapApiExtra,
  cvsApiExtra,
  pushDevicesApiExtra,
  redactCardApiAction,
  redactCardApiState,
  swapApiExtra,
} from "@shared/api-services";
import {
  configureCardSessionRenewal,
  isCardSessionCurrent,
  readCardSession,
  refreshCardSession,
} from "@features/platform-card";
import { setSignedIn } from "@features/flow-pay-card-auth/state";
import {
  createAccountAliasMiddleware,
  withAccountAliases,
} from "~/renderer/middlewares/accountAlias";
import logger from "~/renderer/middlewares/logger";
import reducers, { State } from "~/renderer/reducers";
import { applyLldRTKApiMiddlewares } from "~/renderer/reducers/rtkQueryApi";
import { createIdentitiesSyncMiddleware } from "@domain/api-push-devices";
import { canPushDeviceIdsSelector, languageSelector } from "~/renderer/reducers/settings";
import {
  createFeatureFlagsMiddleware,
  selectFeature,
  type PartialFeatures,
} from "@shared/feature-flags";
import { fetchRemoteFlags as defaultFetchRemoteFlags } from "~/firebase/remoteConfig";
import { sleepingListener } from "./sleepingListener";
type Props = {
  state?: State;
  dbMiddleware?: Middleware;
  analyticsMiddleware?: Middleware;
  /**
   * Remote-flags fetcher driving the polling loop. Defaults to the Firebase fetcher.
   * Pass `null` to disable polling (e.g. unit tests, which must not hit a live backend).
   */
  fetchRemoteFlags?: (() => Promise<PartialFeatures>) | null;
};

const customCreateStore = ({
  state,
  dbMiddleware,
  analyticsMiddleware,
  fetchRemoteFlags = defaultFetchRemoteFlags,
}: Props) => {
  const store = configureStore({
    reducer: reducers,
    preloadedState: withAccountAliases(state),
    middleware: getDefaultMiddleware =>
      applyLldRTKApiMiddlewares(
        getDefaultMiddleware({
          serializableCheck: false,
          immutableCheck: false,
          thunk: {
            extraArgument: {
              ...calApiExtra({
                calServiceUrl: getEnv("CAL_SERVICE_URL"),
                ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
              }),
              ...cvsApiExtra({
                countervaluesServiceUrl: getEnv("LEDGER_COUNTERVALUES_API"),
              }),
              ...coinMarketCapApiExtra({
                coinMarketCapApiUrl: getEnv("CMC_API_URL"),
              }),
              ...cardApiExtra({
                // Read on every request, so the debug settings can change them without a restart.
                getCardApiBaseUrl: () => getEnv("CARD_API_URL"),
                getCardBaanxClientKey: () => getEnv("CARD_BAANX_CLIENT_KEY"),
                readCardSession,
                isCardSessionCurrent,
                refreshCardSession,
              }),
              ...pushDevicesApiExtra({
                pushDevicesServiceUrl: getEnv("PUSH_DEVICES_SERVICE_URL"),
                ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
              }),
              ...swapApiExtra({
                swapApiBaseUrl: getEnv("SWAP_API_BASE"),
                ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
              }),
              ...authApiExtra({
                isFeatureEnabled: (): boolean =>
                  selectFeature(store.getState(), "lwdAuth").enabled ?? false,
                authProvider: new AuthSDK(
                  {
                    clientId: getEnv("LEDGER_AUTH_CLIENT_ID"),
                    keycloakBaseUrl(): string | null {
                      const environment = authEnvironmentSelector(store.getState());
                      return environment && getEnv(`LEDGER_AUTH_KEYCLOAK_BASE_URL_${environment}`);
                    },
                    keycloakRealm: getEnv("LEDGER_AUTH_KEYCLOAK_REALM"),
                    disablePkce: true,
                  },
                  {
                    provider: new LkrpIdentityProvider(
                      (): TrustchainStore => store.getState().trustchain,
                    ),
                  },
                ),
              }),
            },
          },
        }),
      )
        .concat(logger)
        .concat(createAccountAliasMiddleware())
        .concat(analyticsMiddleware ? [analyticsMiddleware] : [])
        .concat(dbMiddleware ? [dbMiddleware] : [])
        .concat(
          createIdentitiesSyncMiddleware({
            pushDevicesServiceUrl: getEnv("PUSH_DEVICES_SERVICE_URL").trim(),
            getIdentitiesState: ({ identities }: State) => identities,
            getAnalyticsConsent: canPushDeviceIdsSelector,
          }),
        )
        .concat(
          createFeatureFlagsMiddleware<State>({
            resolutionConfig: {
              platform: "desktop",
              appVersion: __APP_VERSION__,
              envFlags: getEnv("FEATURE_FLAGS") as PartialFeatures,
            },
            fetchRemoteFlags: fetchRemoteFlags ?? undefined,
            getAppLanguage: languageSelector,
          }),
        )
        .concat(sleepingListener.middleware),
    // Both OAuth2 grants are Card endpoints, so their arguments and their answers ride on redux
    // actions, and DevTools serializes every action and every state it is given.
    devTools: __DEV__
      ? { actionSanitizer: redactCardApiAction, stateSanitizer: redactCardApiState }
      : false,
  });

  // After the store exists, because a renewal dispatches the refresh grant through it. One renewal
  // is installed per store, and the newest store replaces the one before it: a renderer runs one
  // store, so the only caller that builds a second one is a test, which wants the newest.
  configureCardSessionRenewal({
    dispatch: store.dispatch,
    onCardSessionEnded: () => {
      // Published first, and synchronously: no request is waiting on it, and every screen outside
      // the login machine reads this flag to decide whether it belongs on screen.
      store.dispatch(setSignedIn(false));
      // Deferred, because `resetApiState` aborts every running query — including the request whose
      // 401 started this renewal. An aborted request resolves from the uninitialized substate, so
      // its `unwrap()` would answer `undefined` instead of throwing the 401 the base query is about
      // to return, and the login machine would read that as a signed-in user. A macrotask is late
      // enough for the answer to reach its caller first.
      setTimeout(() => store.dispatch(cardApi.util.resetApiState()), 0);
    },
  });

  return store;
};

export type ReduxStore = ReturnType<typeof customCreateStore>;
export type AppDispatch = ThunkDispatch<State, unknown, UnknownAction> & ReduxStore["dispatch"];

export default customCreateStore;
