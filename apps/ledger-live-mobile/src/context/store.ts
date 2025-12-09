import Config from "react-native-config";
import { configureStore, StoreEnhancer } from "@reduxjs/toolkit";
import reducers from "~/reducers";
import { rebootMiddleware } from "~/middleware/rebootMiddleware";
import { rozeniteDevToolsEnhancer } from "@rozenite/redux-devtools-plugin";
import { applyLlmRTKApiMiddlewares } from "./rtkQueryApi";
import { setupCryptoAssetsStore } from "../config/bridge-setup";
import { setupRecentAddressesStore } from "LLM/storage/recentAddresses";
import { createIdentitiesSyncMiddleware } from "@ledgerhq/identities";
import { analyticsEnabledSelector } from "~/reducers/settings";
import type { State } from "~/reducers/types";

// === STORE CONFIGURATION ===
export const store = configureStore({
  reducer: reducers,
  devTools: !!Config.DEBUG_RNDEBUGGER,
  middleware: getDefaultMiddleware => {
    const identitiesSyncMiddleware = createIdentitiesSyncMiddleware({
      getState: () => store.getState(),
      dispatch: action => store.dispatch(action),
      getIdentitiesState: (state: State) => state.identities,
      getAnalyticsConsent: (state: State) => analyticsEnabledSelector(state),
    });

    return applyLlmRTKApiMiddlewares(
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
    ).concat(identitiesSyncMiddleware, rebootMiddleware);
  },

  enhancers: getDefaultEnhancers => {
    const enhancers = getDefaultEnhancers();
    // Type assertion needed due to Redux version compatibility types between v4 and v5
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return enhancers.concat(rozeniteDevToolsEnhancer() as StoreEnhancer);
  },
});

export type StoreType = typeof store;

export const getState = (): State => store.getState();

setupRecentAddressesStore(store);
setupCryptoAssetsStore(store);
