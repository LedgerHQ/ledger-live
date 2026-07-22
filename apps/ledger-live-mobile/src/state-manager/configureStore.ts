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
import { createIdentitiesSyncMiddleware, pushDevicesApiExtra } from "@domain/api-push-devices";
import { createPkcePairWithExpoCrypto } from "~/helpers/pkce";
import { State } from "~/reducers/types";
import { canPushDeviceIdsSelector, languageSelector } from "~/reducers/settings";
import { getEnv } from "@shared/env";
import { calApiExtra } from "@domain/api-currency-token";
import { cvsApiExtra } from "@domain/api-currency-fiat";
import { marketSentimentApiExtra } from "@domain/api-market-sentiment";
import { altcoinsSentimentApiExtra } from "@domain/api-altcoins-sentiment";
import { payCardApiExtra } from "@domain/api-pay-card";
import {
  createFeatureFlagsMiddleware,
  selectFeature,
  type PartialFeatures,
} from "@shared/feature-flags";
import { fetchRemoteFlags } from "~/firebase/remoteConfig";

const listenerMiddleware = createListenerMiddleware();

const lkrpIdentityProvider = new LkrpIdentityProvider();
listenerMiddleware.startListening({
  predicate: action => action.type.startsWith(trustchainStoreActionTypePrefix),
  effect(_action, listenerApi) {
    const { trustchain } = listenerApi.getState() as State;
    lkrpIdentityProvider.setTrustchainStore(trustchain);
  },
});

const authSDKRef: { current?: AuthSDK } = {};
const authSDK = new AuthSDK(
  {
    clientId: getEnv("LEDGER_AUTH_CLIENT_ID"),
    keycloakBaseUrl: getEnv("LEDGER_AUTH_KEYCLOAK_BASE_URL_PROD"),
    keycloakRealm: getEnv("LEDGER_AUTH_KEYCLOAK_REALM"),
  },
  {
    provider: lkrpIdentityProvider,
    createPkcePair: createPkcePairWithExpoCrypto,
  },
);
const syncAuthSDK = (currentState: State) => {
  authSDKRef.current = selectFeature(currentState, "lwmAuth").enabled ? authSDK : undefined;
};
listenerMiddleware.startListening({
  predicate: action => action.type.startsWith("featureFlags/"),
  effect(_action, listenerApi) {
    syncAuthSDK(listenerApi.getState() as State);
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
            ...calApiExtra({
              calServiceUrl: getEnv("CAL_SERVICE_URL"),
              ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
            }),
            ...cvsApiExtra({
              countervaluesServiceUrl: getEnv("LEDGER_COUNTERVALUES_API"),
            }),
            ...marketSentimentApiExtra({
              coinMarketCapApiUrl: getEnv("CMC_API_URL"),
            }),
            ...altcoinsSentimentApiExtra({
              coinMarketCapApiUrl: getEnv("CMC_API_URL"),
            }),
            ...pushDevicesApiExtra({
              pushDevicesServiceUrl: getEnv("PUSH_DEVICES_SERVICE_URL"),
              ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
            }),
            ...payCardApiExtra({
              // LIVE-33829: force mocks until Pay Card API base URL is wired.
              payCardApiMocksEnabled: true,
            }),
            get authSDK() {
              return authSDKRef.current;
            },
          },
        },
      }).prepend(listenerMiddleware.middleware),
    )
      .concat(rebootMiddleware)
      .concat(
        createIdentitiesSyncMiddleware({
          pushDevicesServiceUrl: getEnv("PUSH_DEVICES_SERVICE_URL").trim(),
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

syncAuthSDK(store.getState());

export type StoreType = typeof store;
export type AppDispatch = typeof store.dispatch;

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
