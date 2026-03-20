import { configureStore, Middleware, ThunkDispatch } from "@reduxjs/toolkit";
import { UnknownAction } from "redux";
import logger from "~/renderer/middlewares/logger";
import reducers, { State } from "~/renderer/reducers";
import { applyLldRTKApiMiddlewares } from "~/renderer/reducers/rtkQueryApi";
import { createIdentitiesSyncMiddleware } from "@ledgerhq/client-ids/store";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";
import { FEATURE_FLAGS_INITIAL_STATE } from "@shared/feature-flags";

type Props = {
  state?: State;
  dbMiddleware?: Middleware;
  analyticsMiddleware?: Middleware;
};

const customCreateStore = ({ state, dbMiddleware, analyticsMiddleware }: Props) => {
  // Bridge: mirror legacy settings into the new featureFlags slice so that
  // tests setting state.settings.overriddenFeatureFlags / featureFlagsButtonVisible
  // still work with the selector proxies that now read from state.featureFlags.
  if (state?.settings) {
    const patch: Partial<State["featureFlags"]> = {};

    const legacyOverrides = state.settings.overriddenFeatureFlags;
    if (legacyOverrides) {
      const filtered = Object.fromEntries(
        Object.entries(legacyOverrides).filter(([, v]) => v !== undefined),
      );
      if (Object.keys(filtered).length > 0) {
        patch.overrides = filtered as State["featureFlags"]["overrides"];
      }
    }

    if (state.settings.featureFlagsButtonVisible != null) {
      patch.bannerVisible = state.settings.featureFlagsButtonVisible;
    }

    if (Object.keys(patch).length > 0) {
      const base = state.featureFlags ?? FEATURE_FLAGS_INITIAL_STATE;
      state = { ...state, featureFlags: { ...base, ...patch } };
    }
  }

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
            getAnalyticsConsent: (state: State) => trackingEnabledSelector(state),
          }),
        ),
    devTools: __DEV__,
  });
  return store;
};

export type ReduxStore = ReturnType<typeof customCreateStore>;
export type AppDispatch = ThunkDispatch<State, unknown, UnknownAction> & ReduxStore["dispatch"];

export default customCreateStore;
