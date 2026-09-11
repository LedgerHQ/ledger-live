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
import appLogger from "~/renderer/logger";
import reducers, { State } from "~/renderer/reducers";
import { applyLldRTKApiMiddlewares } from "~/renderer/reducers/rtkQueryApi";
import { createIdentitiesSyncMiddleware } from "@domain/api-push-devices";
import { canPushDeviceIdsSelector, languageSelector } from "~/renderer/reducers/settings";
import {
  createFeatureFlagsMiddleware,
  selectFeature,
  type FeatureFlagsReadFailure,
  type PartialFeatures,
} from "@shared/feature-flags";
import {
  fetchRemoteFlags as defaultFetchRemoteFlags,
  readCachedFlags as defaultReadCachedFlags,
} from "~/firebase/remoteConfig";
import { sleepingListener } from "./sleepingListener";
/**
 * Reports only the failures that actually degrade the session. A warm failure is routine: the
 * previously read values stay in place and the next poll retries. A cold one means the app is
 * running on compiled defaults, which is a misconfigured session rather than a passing network
 * blip, and is precisely the signal whose absence let a staging leak run unnoticed for a whole
 * release cycle.
 *
 * `logger.critical` rather than a bare console call: it is the one path wired to Datadog
 * (breadcrumb plus `captureException`), so a cold boot becomes searchable instead of invisible.
 */
function reportFeatureFlagsReadFailure(error: unknown, { stage, isCold }: FeatureFlagsReadFailure) {
  if (!isCold) return;
  appLogger.critical(error, `Feature flags: ${stage} read failed, resolving on compiled defaults`);
}

type Props = {
  state?: State;
  dbMiddleware?: Middleware;
  analyticsMiddleware?: Middleware;
  /**
   * Remote-flags fetcher driving the polling loop. Defaults to the Firebase fetcher.
   * Pass `null` to disable polling (e.g. unit tests, which must not hit a live backend).
   */
  fetchRemoteFlags?: (() => Promise<PartialFeatures>) | null;
  /**
   * Network-free read of the flags Firebase already cached on this device, used to prime the
   * slice before the first fetch. Defaults to the Firebase reader, or to `null` when
   * `fetchRemoteFlags` is explicitly disabled, so opting out of the backend opts out of the
   * whole Firebase path. Pass `null` to disable it on its own.
   */
  readCachedFlags?: (() => Promise<PartialFeatures>) | null;
};

const customCreateStore = ({
  state,
  dbMiddleware,
  analyticsMiddleware,
  fetchRemoteFlags = defaultFetchRemoteFlags,
  readCachedFlags = fetchRemoteFlags === null ? null : defaultReadCachedFlags,
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
            readCachedFlags: readCachedFlags ?? undefined,
            fetchRemoteFlags: fetchRemoteFlags ?? undefined,
            getAppLanguage: languageSelector,
            onRemoteFlagsError: reportFeatureFlagsReadFailure,
          }),
        )
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
