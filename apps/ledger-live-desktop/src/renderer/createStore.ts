import { configureStore, Middleware } from "@reduxjs/toolkit";
import logger from "~/renderer/middlewares/logger";
import reducers, { State } from "~/renderer/reducers";

type Props = {
  state?: State;
  dbMiddleware?: Middleware;
  analyticsMiddleware?: Middleware;
};

const customCreateStore = ({ state, dbMiddleware, analyticsMiddleware }: Props) => {
  return configureStore({
    reducer: reducers,
    preloadedState: state,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(
        logger,
        ...(analyticsMiddleware ? [analyticsMiddleware] : []),
        ...(dbMiddleware ? [dbMiddleware] : []),
      ),
    devTools: __DEV__,
  });
};

export type ReduxStore = ReturnType<typeof customCreateStore>;

export default customCreateStore;
