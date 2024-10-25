import Config from "react-native-config";
import { configureStore } from "@reduxjs/toolkit";
import reducers from "~/reducers";

export const store = configureStore({
  reducer: reducers,
  devTools: !!Config.DEBUG_RNDEBUGGER,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
});

export type StoreType = typeof store;
