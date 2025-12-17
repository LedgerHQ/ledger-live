import { configureStore, Middleware } from "@reduxjs/toolkit";
import logger from "~/renderer/middlewares/logger";
import reducers, { State } from "~/renderer/reducers";
import { lldRTKApiMiddlewares } from "./reducers/rtkQueryApi";
import { createIdentitiesSyncMiddleware } from "@ledgerhq/client-ids/store";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";
import { getUserId } from "~/helpers/user";

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
      getDefaultMiddleware({
        serializableCheck: false,
        // NOTE: not checking immutability for now as it crashes when some coins are syncing.
        immutableCheck: false,
      }).concat(
        logger,
        ...lldRTKApiMiddlewares,
        ...(analyticsMiddleware ? [analyticsMiddleware] : []),
        ...(dbMiddleware ? [dbMiddleware] : []),
        createIdentitiesSyncMiddleware({
          getIdentitiesState: (state: State) => state.identities,
          getUserId: async (_state: State) => {
            // TEMPORARY: Using getUserId() from helpers until full migration to identities system
            // FIXME LIVE-23880: Migrate to use userId from identities store or app-level user management
            try {
              const userId = getUserId();
              return Promise.resolve(userId || "");
            } catch {
              return Promise.resolve("");
            }
          },
          getAnalyticsConsent: (state: State) => trackingEnabledSelector(state),
        }),
      ),
    devTools: __DEV__,
  });
  return store;
};

export type ReduxStore = ReturnType<typeof customCreateStore>;

export default customCreateStore;
