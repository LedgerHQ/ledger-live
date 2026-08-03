import {
  configureStore,
  createListenerMiddleware,
  type Middleware,
  type ThunkDispatch,
} from "@reduxjs/toolkit";
import { UnknownAction } from "redux";
import { AuthSDK } from "@ledgerhq/ledger-auth";
import { getEnv } from "@shared/env";
import { authApiExtra } from "@shared/auth";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import { calApiExtra, coinMarketCapApiExtra, cvsApiExtra } from "@domain/api-services";
import { payCardApiExtra } from "@domain/api-pay-card";
import logger from "~/renderer/middlewares/logger";
import reducers, { State } from "~/renderer/reducers";
import { applyLldRTKApiMiddlewares } from "~/renderer/reducers/rtkQueryApi";
import { createIdentitiesSyncMiddleware, pushDevicesApiExtra } from "@domain/api-push-devices";
import { canPushDeviceIdsSelector, languageSelector } from "~/renderer/reducers/settings";
import { createFeatureFlagsMiddleware, type PartialFeatures } from "@shared/feature-flags";
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
  // This listenerMiddleware is cross-scope as it is preferable to have one instance per store
  // Source: https://github.com/reduxjs/redux-toolkit/discussions/3665
  const listenerMiddleware = createListenerMiddleware<State>();

  const store = configureStore({
    reducer: reducers,
    preloadedState: state,
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
              ...pushDevicesApiExtra({
                pushDevicesServiceUrl: getEnv("PUSH_DEVICES_SERVICE_URL"),
                ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
              }),
              ...payCardApiExtra({
                // LIVE-33829: force mocks until Pay Card API base URL is wired.
                payCardApiMocksEnabled: true,
              }),
              ...authApiExtra({
                authFeatureId: "lwdAuth",
                startListening: listenerMiddleware.startListening,
                providerParams: {
                  identityProvider: new LkrpIdentityProvider<State>({
                    startListening: listenerMiddleware.startListening,
                  }),
                },
                createAuthProvider: (environment, { identityProvider }) =>
                  new AuthSDK(
                    {
                      clientId: getEnv("LEDGER_AUTH_CLIENT_ID"),
                      keycloakBaseUrl: getEnv(`LEDGER_AUTH_KEYCLOAK_BASE_URL_${environment}`),
                      keycloakRealm: getEnv("LEDGER_AUTH_KEYCLOAK_REALM"),
                      disablePkce: true,
                    },
                    { provider: identityProvider },
                  ),
              }),
            },
          },
        }).prepend(listenerMiddleware.middleware),
      )
        .concat(logger)
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
    devTools: __DEV__,
  });

  return store;
};

export type ReduxStore = ReturnType<typeof customCreateStore>;
export type AppDispatch = ThunkDispatch<State, unknown, UnknownAction> & ReduxStore["dispatch"];

export default customCreateStore;
