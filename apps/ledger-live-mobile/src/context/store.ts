import Config from "react-native-config";
import { configureStore } from "@reduxjs/toolkit";
import reducers from "~/reducers";
import Rectotron from "~/ReactotronConfig";
import { GetDefaultEnhancers } from "@reduxjs/toolkit/dist/getDefaultEnhancers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createEnhancers = (getDefaultEnhancers: GetDefaultEnhancers<any>) => {
  if (__DEV__) {
    return getDefaultEnhancers().concat(Rectotron.createEnhancer());
  } else {
    return getDefaultEnhancers();
  }
};

export const store = configureStore({
  reducer: reducers,
  devTools: !!Config.DEBUG_RNDEBUGGER,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
  enhancers: createEnhancers,
});

export type StoreType = typeof store;
