import { configureStore } from "@reduxjs/toolkit";
import logger from "~/renderer/middlewares/logger";
import reducers, { State } from "~/renderer/reducers";
import { lldRTKApiMiddlewares } from "./reducers/rtkQueryApi";
import { createIdentitiesSyncMiddleware } from "@ledgerhq/identities";
import { shareAnalyticsSelector } from "./reducers/settings";
import type { Action, Middleware } from "@reduxjs/toolkit";

type Props = {
  state?: State;
  dbMiddleware?: Middleware;
  analyticsMiddleware?: Middleware;
};

const customCreateStore = ({ state, dbMiddleware, analyticsMiddleware }: Props) => {
  const store = configureStore({
    reducer: reducers,
    preloadedState: state,
    middleware: getDefaultMiddleware => {
      const identitiesSyncMiddleware = createIdentitiesSyncMiddleware({
        getState: () => store.getState(),
        dispatch: (action: Action) => store.dispatch(action),
        getIdentitiesState: (state: State) => state.identities,
        getAnalyticsConsent: (state: State) => shareAnalyticsSelector(state),
      });

      return getDefaultMiddleware({
        serializableCheck: false,
        // NOTE: not checking immutability for now as it crashes when some coins are syncing.
        immutableCheck: false,
      }).concat(
        logger,
        ...lldRTKApiMiddlewares,
        identitiesSyncMiddleware,
        ...(analyticsMiddleware ? [analyticsMiddleware] : []),
        ...(dbMiddleware ? [dbMiddleware] : []),
      );
    },
    devTools: __DEV__,
  });

  return store;
};

export type ReduxStore = ReturnType<typeof customCreateStore>;

export default customCreateStore;
