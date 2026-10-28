import { configureStore, type Middleware, type ThunkDispatch } from "@reduxjs/toolkit";
import { UnknownAction } from "redux";
import { getEnv } from "@shared/env";
import { getPortfolioServiceUrl } from "~/config/portfolioService";
import { createAppConfigMiddleware } from "@shared/app-config";
import {
  calApiExtra,
  cardApi,
  cardApiExtra,
  coinMarketCapApiExtra,
  cvsApiExtra,
  portfolioApiExtra,
  pushDevicesApiExtra,
  redactCardApiAction,
  redactCardApiState,
  redactPortfolioApiAction,
  redactPortfolioApiState,
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
import { accountDataExtra } from "@domain/api-account-data";
import { accountDataRecorder, accountDataSources } from "~/config/account-data-setup";
import { canPushDeviceIdsSelector } from "~/renderer/reducers/settings";
import { loadAppConfig } from "~/setup";
import { sleepingListener } from "./sleepingListener";
import {
  createDesktopFeatureFlagsMiddleware,
  type FeatureFlagsSources,
} from "./middleware/feature-flags";
import {
  createDesktopCountervaluesMiddleware,
  type CountervaluesSources,
} from "./middleware/countervalues";
import { createDesktopAuthMiddleware } from "./middleware/auth";

type Props = FeatureFlagsSources & {
  state?: State;
  dbMiddleware?: Middleware;
  analyticsMiddleware?: Middleware;
  /** The countervalues loop's app wiring (window events, persistence); left out by unit tests. */
  countervalues?: CountervaluesSources;
  appConfig?: ReturnType<typeof loadAppConfig>;
};

const customCreateStore = ({
  state,
  dbMiddleware,
  analyticsMiddleware,
  fetchRemoteFlags,
  readCachedFlags,
  countervalues,
  appConfig: { config: appConfig, session: appConfigSession } = loadAppConfig(),
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
              ...accountDataExtra(
                accountDataSources(
                  (): State => store.getState(),
                  (action): unknown => store.dispatch(action),
                ),
              ),
              ...calApiExtra({
                calServiceUrl: getEnv("CAL_SERVICE_URL"),
                ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
              }),
              ...cvsApiExtra({
                getCountervaluesServiceUrl: () => getEnv("LEDGER_COUNTERVALUES_API"),
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
              ...portfolioApiExtra({
                // POC, dev only: empty disables the service.
                portfolioServiceUrl: getPortfolioServiceUrl(),
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
            },
          },
        }),
      )
        // Before the app's middlewares, so the provider request stops here instead of reaching the logger and db.
        .concat(createDesktopAuthMiddleware(appConfig))
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
          createAppConfigMiddleware({
            session: appConfigSession,
            reload: () => window.api?.reloadRenderer(),
          }),
        )
        .concat(createDesktopFeatureFlagsMiddleware({ fetchRemoteFlags, readCachedFlags }))
        .concat(sleepingListener.middleware)
        .concat(createDesktopCountervaluesMiddleware(countervalues))
        .concat(accountDataRecorder.middleware),
    devTools: __DEV__
      ? {
          actionSanitizer: action => redactPortfolioApiAction(redactCardApiAction(action)),
          stateSanitizer: state => redactPortfolioApiState(redactCardApiState(state)),
        }
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
