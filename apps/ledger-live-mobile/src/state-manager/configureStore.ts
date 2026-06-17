import Config from "react-native-config";
import { configureStore, createListenerMiddleware, StoreEnhancer } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";
import VersionNumber from "react-native-version-number";
import { AuthSDK } from "@ledgerhq/ledger-auth";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import { trustchainStoreActionTypePrefix } from "@ledgerhq/ledger-key-ring-protocol/store";
import reducers from "~/reducers";
import { rebootMiddleware } from "~/middleware/rebootMiddleware";
import { rozeniteDevToolsEnhancer } from "@rozenite/redux-devtools-plugin";
import { applyLlmRTKApiMiddlewares } from "~/context/rtkQueryApi";
import { setupCryptoAssetsStore } from "~/config/bridge-setup";
import { setupRecentAddressesStore } from "LLM/storage/recentAddresses";
import { createIdentitiesSyncMiddleware } from "@ledgerhq/client-ids/store";
import { State } from "~/reducers/types";
import { canPushDeviceIdsSelector, languageSelector } from "~/reducers/settings";
import { getEnv } from "@ledgerhq/live-env";
import { createFeatureFlagsMiddleware, type PartialFeatures } from "@shared/feature-flags";
import { fetchRemoteFlags } from "~/firebase/remoteConfig";

export type AppExtraArgument = {
  authSDK: AuthSDK;
};

const lkrpIdentityProvider = new LkrpIdentityProvider();
const authSDK = new AuthSDK(
  {
    clientId: getEnv("LEDGER_AUTH_CLIENT_ID"),
    keycloakBaseUrl: getEnv("LEDGER_AUTH_KEYCLOAK_BASE_URL"),
    keycloakRealm: getEnv("LEDGER_AUTH_KEYCLOAK_REALM"),
  },
  { provider: lkrpIdentityProvider },
);

const authListenerMiddleware = createListenerMiddleware();
authListenerMiddleware.startListening({
  predicate: action =>
    typeof action.type === "string" && action.type.startsWith(trustchainStoreActionTypePrefix),
  effect: (_action, listenerApi) => {
    syncLkrpIdentityProviderFromState(lkrpIdentityProvider, listenerApi.getState() as State);
  },
});

export const store = configureStore({
  reducer: reducers,
  devTools: !!Config.DEBUG_RNDEBUGGER,
  middleware: getDefaultMiddleware =>
    applyLlmRTKApiMiddlewares(
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
        thunk: {
          extraArgument: {
            authSDK,
          },
        },
      }).prepend(authListenerMiddleware.middleware),
    )
      .concat(rebootMiddleware)
      .concat(
        createIdentitiesSyncMiddleware({
          getIdentitiesState: (state: State) => state.identities,
          getAnalyticsConsent: canPushDeviceIdsSelector,
        }),
      )
      .concat(
        createFeatureFlagsMiddleware<State>({
          resolutionConfig: {
            platform: Platform.OS === "ios" ? "ios" : "android",
            appVersion: VersionNumber.appVersion ?? undefined,
            envFlags: getEnv("FEATURE_FLAGS") as PartialFeatures,
          },
          fetchRemoteFlags,
          getAppLanguage: languageSelector,
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
export type AppDispatch = typeof store.dispatch;

syncLkrpIdentityProviderFromState(lkrpIdentityProvider, store.getState());

setupListeners(store.dispatch, (dispatch, { onOnline, onOffline }) => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      dispatch(onOnline());
    } else {
      dispatch(onOffline());
    }
  });
  return unsubscribe;
});
setupRecentAddressesStore(store);
setupCryptoAssetsStore(store);

function syncLkrpIdentityProviderFromState(
  lkrpIdentityProvider: LkrpIdentityProvider,
  { trustchain }: State,
): void {
  lkrpIdentityProvider.setKeypair(trustchain.memberCredentials || undefined);
  lkrpIdentityProvider.setTrustchainId(trustchain.trustchain?.rootId);
}
