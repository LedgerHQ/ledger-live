import { configureStore, type Middleware, type ThunkDispatch } from "@reduxjs/toolkit";
import { UnknownAction } from "redux";
import { AuthSDK } from "@ledgerhq/auth";
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
  isCardUsEnv,
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
import {
  blacklistedTokenIdsSelector,
  canPushDeviceIdsSelector,
} from "~/renderer/reducers/settings";
import { selectFeature } from "@shared/feature-flags";
import { sleepingListener } from "./sleepingListener";
import {
  createDesktopFeatureFlagsMiddleware,
  type FeatureFlagsSources,
} from "./middleware/feature-flags";

import { createAccountDataRouter } from "@domain/api-account-data-source";
import { CoinModuleSource } from "@features/platform-account-source-coin-module";
import { createCoinModuleHost, FullSyncSource } from "@ledgerhq/live-common/account-data/index";
import { prepareCurrency } from "~/renderer/bridge/cache";
import { accountSelector } from "~/renderer/reducers/accounts";

function createAppAccountDataRouter(getState: () => State) {
  const blacklistedTokenIds = () => blacklistedTokenIdsSelector(getState());
  return createAccountDataRouter([
    new CoinModuleSource(createCoinModuleHost({ blacklistedTokenIds })),
    new FullSyncSource({
      getAccount: accountId => accountSelector(getState(), { accountId }),
      prepareCurrency,
      blacklistedTokenIds,
    }),
  ]);
}

type Props = FeatureFlagsSources & {
  state?: State;
  dbMiddleware?: Middleware;
  analyticsMiddleware?: Middleware;
};

const customCreateStore = ({
  state,
  dbMiddleware,
  analyticsMiddleware,
  fetchRemoteFlags,
  readCachedFlags,
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
              accountData: createAppAccountDataRouter((): State => store.getState()),
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
                isCardUsEnv: () => isCardUsEnv(getEnv("CARD_BAANX_US_APP_ID")),
                readCardSession,
                isCardSessionCurrent,
                refreshCardSession,
              }),
              ...pushDevicesApiExtra({
                pushDevicesServiceUrl: getEnv("PUSH_DEVICES_SERVICE_URL"),
                ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
              }),
              ...swapApiExtra({
                // Read on every request, so the debug settings can change it without a restart.
                getSwapApiBaseUrl: () => getEnv("SWAP_API_BASE"),
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
        .concat(createDesktopFeatureFlagsMiddleware({ fetchRemoteFlags, readCachedFlags }))
        .concat(sleepingListener.middleware),
    devTools: __DEV__
      ? { actionSanitizer: redactCardApiAction, stateSanitizer: redactCardApiState }
      : false,
  });

  configureCardSessionRenewal({
    dispatch: store.dispatch,
    onCardSessionEnded: () => {
      store.dispatch(setSignedIn(false));
      setTimeout(() => store.dispatch(cardApi.util.resetApiState()), 0);
    },
  });

  return store;
};

export type ReduxStore = ReturnType<typeof customCreateStore>;
export type AppDispatch = ThunkDispatch<State, unknown, UnknownAction> & ReduxStore["dispatch"];

export default customCreateStore;
