import Config from "react-native-config";
import { configureStore, StoreEnhancer } from "@reduxjs/toolkit";
import reducers from "~/reducers";
import { rebootMiddleware } from "~/middleware/rebootMiddleware";
import { rozeniteDevToolsEnhancer } from "@rozenite/redux-devtools-plugin";
import { applyLlmRTKApiMiddlewares } from "./rtkQueryApi";
import { setupCryptoAssetsStore } from "../config/bridge-setup";
import { setupRecentAddressesStore } from "LLM/storage/recentAddresses";
import { createIdentitiesSyncMiddleware } from "@ledgerhq/client-ids/store";
import { State } from "~/reducers/types";
import { trackingEnabledSelector } from "~/reducers/settings";
import getOrCreateUser from "~/user";

// === STORE CONFIGURATION ===
export const store = configureStore({
  reducer: reducers,
  devTools: !!Config.DEBUG_RNDEBUGGER,
  middleware: getDefaultMiddleware =>
    applyLlmRTKApiMiddlewares(
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
    )
      .concat(rebootMiddleware)
      .concat(
        createIdentitiesSyncMiddleware({
          getIdentitiesState: (state: State) => state.identities,
          getUserId: async (_state: State) => {
            // FIXME LIVE-23880: Migrate to use userId from identities store or app-level user management
            const { user } = await getOrCreateUser();
            return user.id;
          },
          getAnalyticsConsent: (state: State) => trackingEnabledSelector(state),
        }),
      ),

  enhancers: getDefaultEnhancers => {
    const enhancers = getDefaultEnhancers();
    // Type assertion needed due to Redux version compatibility types between v4 and v5
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return enhancers.concat(rozeniteDevToolsEnhancer() as StoreEnhancer);
  },
});

export type StoreType = typeof store;

setupRecentAddressesStore(store);
setupCryptoAssetsStore(store);
