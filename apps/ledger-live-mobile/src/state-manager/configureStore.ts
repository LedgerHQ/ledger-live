import Config from "react-native-config";
import { configureStore, createListenerMiddleware, type StoreEnhancer } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { authApiExtra } from "@shared/auth";
import { AuthSDK } from "@ledgerhq/ledger-auth";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";
import VersionNumber from "react-native-version-number";
import reducers from "~/reducers";
import { rebootMiddleware } from "~/middleware/rebootMiddleware";
import { rozeniteDevToolsEnhancer } from "@rozenite/redux-devtools-plugin";
import { applyLlmRTKApiMiddlewares } from "~/context/rtkQueryApi";
import { setupCryptoAssetsStore } from "~/config/bridge-setup";
import { setSwapQuotesStore } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/state-manager/store";
import { setupRecentAddressesStore } from "LLM/storage/recentAddresses";
import { createIdentitiesSyncMiddleware } from "@domain/api-push-devices";
import { State } from "~/reducers/types";
import { canPushDeviceIdsSelector, languageSelector } from "~/reducers/settings";
import { getEnv } from "@shared/env";
import {
  calApiExtra,
  coinMarketCapApiExtra,
  cvsApiExtra,
  pushDevicesApiExtra,
  swapApiExtra,
} from "@shared/api-services";
import { payCardApiExtra } from "@domain/api-pay-card";
import { createFeatureFlagsMiddleware, type PartialFeatures } from "@shared/feature-flags";
import { fetchRemoteFlags } from "~/firebase/remoteConfig";
import { sleepingListener } from "./sleepingListener";
import { createPkcePairWithExpoCrypto } from "~/helpers/pkce";

// This listenerMiddleware is cross-scope as it is preferable to have one instance per store
// Source: https://github.com/reduxjs/redux-toolkit/discussions/3665
const listenerMiddleware = createListenerMiddleware<State>();

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
            ...coinMarketCapApiExtra({
              coinMarketCapApiUrl: getEnv("CMC_API_URL"),
            }),
            ...pushDevicesApiExtra({
              pushDevicesServiceUrl: getEnv("PUSH_DEVICES_SERVICE_URL"),
              ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
            }),
            ...swapApiExtra({
              swapApiBaseUrl: getEnv("SWAP_API_BASE"),
              ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
            }),
            ...payCardApiExtra({
              // LIVE-33829: force mocks until Pay Card API base URL is wired.
              payCardApiMocksEnabled: true,
            }),
            ...authApiExtra({
              authFeatureId: "lwmAuth",
              startListening: listenerMiddleware.startListening,
              providerParams: {
                identityProvider: new LkrpIdentityProvider<State>({
                  startListening: listenerMiddleware.startListening,
                }),
              },
              createAuthProvider: (environment, { identityProvider }) =>
                new AuthSDK(
                  {
                    clientId: getEnv("LEDGER_AUTH_CLIENT_ID"),
                    keycloakBaseUrl: getEnv(`LEDGER_AUTH_KEYCLOAK_BASE_URL_${environment}`),
                    keycloakRealm: getEnv("LEDGER_AUTH_KEYCLOAK_REALM"),
                    disablePkce: true,
                  },
                  { provider: identityProvider, createPkcePair: createPkcePairWithExpoCrypto },
                ),
            }),
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
      )
      .concat(sleepingListener.middleware),

  enhancers: getDefaultEnhancers => {
    const enhancers = getDefaultEnhancers();
    // Type assertion needed due to Redux version compatibility types between v4 and v5
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return enhancers.concat(rozeniteDevToolsEnhancer() as StoreEnhancer);
  },
});

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
setSwapQuotesStore(store.dispatch);
