import { configureStore, type Middleware, type ThunkDispatch } from "@reduxjs/toolkit";
import { UnknownAction } from "redux";
import { AuthSDK } from "@ledgerhq/ledger-auth";
import { getEnv } from "@shared/env";
import { authApiExtra, authEnvironmentSelector } from "@shared/auth";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import type { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import {
  calApiExtra,
  cardApiExtra,
  coinMarketCapApiExtra,
  cvsApiExtra,
  pushDevicesApiExtra,
  swapApiExtra,
} from "@shared/api-services";
import { getCardSessionToken, refreshCardSession } from "@features/platform-card";
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
                getCardApiBaseUrl: () => getEnv("CARD_BAANX_API_URL"),
                getCardBaanxClientKey: () => getEnv("CARD_BAANX_CLIENT_KEY"),
                getCardSessionToken,
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
    devTools: __DEV__,
  });

  return store;
};

export type ReduxStore = ReturnType<typeof customCreateStore>;
export type AppDispatch = ThunkDispatch<State, unknown, UnknownAction> & ReduxStore["dispatch"];

export default customCreateStore;
