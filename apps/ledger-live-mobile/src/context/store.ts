import Config from "react-native-config";
import { configureStore, Tuple } from "@reduxjs/toolkit";
import reducers from "~/reducers";
import Rectotron from "~/ReactotronConfig";
import { assetsDataApi } from "@ledgerhq/live-common/dada-client/state-manager/api";
import { rebootMiddleware } from "~/middleware/rebootMiddleware";

// === STORE CONFIGURATION ===
export const store = configureStore({
  reducer: reducers,
  devTools: !!Config.DEBUG_RNDEBUGGER,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ serializableCheck: false, immutableCheck: false })
      .concat(assetsDataApi.middleware)
      .concat(rebootMiddleware),

  enhancers: getDefaultEnhancers =>
    new Tuple(...(__DEV__ ? [Rectotron.createEnhancer()] : []), ...getDefaultEnhancers()),
});

export type StoreType = typeof store;
