import Config from "react-native-config";
import { configureStore, type Middleware } from "@reduxjs/toolkit";
import reducers from "~/reducers";

const middlewares: Middleware[] = [];

if (Config.DEBUG_RNDEBUGGER) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const createDebugger = require("redux-flipper").default;
  middlewares.push(createDebugger());
}

export const store = configureStore({
  reducer: reducers,
  devTools: !!Config.DEBUG_RNDEBUGGER,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat(middlewares),
});

export type StoreType = typeof store;
