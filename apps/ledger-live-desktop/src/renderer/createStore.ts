import { configureStore, Middleware, ThunkDispatch } from "@reduxjs/toolkit";
import { UnknownAction } from "redux";
import logger from "~/renderer/middlewares/logger";
import reducers, { State } from "~/renderer/reducers";
import { applyLldRTKApiMiddlewares } from "./reducers/rtkQueryApi";
import { createIdentitiesSyncMiddleware } from "@ledgerhq/client-ids/store";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";

type Props = {
  state?: State;
  dbMiddleware?: Middleware;
  analyticsMiddleware?: Middleware;
};

const customCreateStore = ({ state, dbMiddleware, analyticsMiddleware }: Props) => {
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
