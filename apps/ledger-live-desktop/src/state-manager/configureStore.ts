import { configureStore, Middleware, ThunkDispatch } from "@reduxjs/toolkit";
import { UnknownAction } from "redux";
import { getEnv } from "@ledgerhq/live-env";
import logger from "~/renderer/middlewares/logger";
import reducers, { State } from "~/renderer/reducers";
import { applyLldRTKApiMiddlewares } from "~/renderer/reducers/rtkQueryApi";
import { createIdentitiesSyncMiddleware } from "@ledgerhq/client-ids/store";
import { canPushDeviceIdsSelector, languageSelector } from "~/renderer/reducers/settings";
import { createFeatureFlagsMiddleware, type PartialFeatures } from "@shared/feature-flags";
import { fetchRemoteFlags as defaultFetchRemoteFlags } from "~/firebase/remoteConfig";
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
    preloadedState: state,
    middleware: getDefaultMiddleware =>
      applyLldRTKApiMiddlewares(
        getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
      )
        .concat(logger)
        .concat(analyticsMiddleware ? [analyticsMiddleware] : [])
        .concat(dbMiddleware ? [dbMiddleware] : [])
        .concat(
          createIdentitiesSyncMiddleware({
            getIdentitiesState: (state: State) => state.identities,
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
        ),
    devTools: __DEV__,
  });
  return store;
};

export type ReduxStore = ReturnType<typeof customCreateStore>;
export type AppDispatch = ThunkDispatch<State, unknown, UnknownAction> & ReduxStore["dispatch"];

export default customCreateStore;
