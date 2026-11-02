import { configureStore, type Middleware, type ThunkDispatch } from "@reduxjs/toolkit";
import { UnknownAction } from "redux";
import { getEnv } from "@shared/env";
import { createAppConfigMiddleware } from "@shared/app-config";
import {
  cardApi,
  redactCardApiAction,
  redactCardApiState,
  redactPortfolioApiAction,
  redactPortfolioApiState,
} from "@shared/api-services";
import { configureCardSessionRenewal } from "@features/platform-card";
import { setSignedIn } from "@features/flow-pay-card-auth/state";
import {
  createAccountAliasMiddleware,
  withAccountAliases,
} from "~/renderer/middlewares/accountAlias";
import logger from "~/renderer/middlewares/logger";
import reducers, { State } from "~/renderer/reducers";
import { apiServices, applyLldRTKApiMiddlewares } from "~/renderer/reducers/rtkQueryApi";
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
              ...apiServices.createExtra({ ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION") }),
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
