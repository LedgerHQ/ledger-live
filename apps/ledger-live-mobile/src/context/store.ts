import Config from "react-native-config";
import { configureStore, Tuple } from "@reduxjs/toolkit";
import reducers from "~/reducers";
import Rectotron from "~/ReactotronConfig";
import { assetsDataApi } from "@ledgerhq/live-common/modularDrawer/data/state-manager/api";

// === STORE CONFIGURATION ===
export const store = configureStore({
  reducer: reducers,
  devTools: !!Config.DEBUG_RNDEBUGGER,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }).concat(
      assetsDataApi.middleware,
    ),

  enhancers: getDefaultEnhancers =>
    new Tuple(
      ...(__DEV__ ? [...getDefaultEnhancers(), Rectotron.createEnhancer()] : []),
      ...getDefaultEnhancers(),
    ),
});

export type StoreType = typeof store;
