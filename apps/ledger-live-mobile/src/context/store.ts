import Config from "react-native-config";
import { configureStore } from "@reduxjs/toolkit";
import reducers from "~/reducers";
import Rectotron from "~/ReactotronConfig";

export const store = configureStore({
  reducer: reducers,
  devTools: !!Config.DEBUG_RNDEBUGGER,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
  ...(__DEV__ && {
    enhancers: getDefaultEnhancers => getDefaultEnhancers().concat(Rectotron.createEnhancer()),
  }),
});

export type StoreType = typeof store;
