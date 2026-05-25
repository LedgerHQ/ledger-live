import Config from "react-native-config";
import { configureStore, StoreEnhancer } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";
import VersionNumber from "react-native-version-number";
import reducers from "~/reducers";
import { rebootMiddleware } from "~/middleware/rebootMiddleware";
import { rozeniteDevToolsEnhancer } from "@rozenite/redux-devtools-plugin";
import { applyLlmRTKApiMiddlewares } from "~/context/rtkQueryApi";
import { setupCryptoAssetsStore } from "~/config/bridge-setup";
import { setupRecentAddressesStore } from "LLM/storage/recentAddresses";
import { createIdentitiesSyncMiddleware, pushDevicesApiExtra } from "@domain/api-push-devices";
import { State } from "~/reducers/types";
import { canPushDeviceIdsSelector, languageSelector } from "~/reducers/settings";
import { getEnv } from "@ledgerhq/live-env";
import { calApiExtra } from "@domain/api-currency-token";
import { cvsApiExtra } from "@domain/api-currency-fiat";
import { marketSentimentApiExtra } from "@domain/api-market-sentiment";
import { altcoinsSentimentApiExtra } from "@domain/api-altcoins-sentiment";
import { payCardApiExtra } from "@domain/api-pay-card";
import { createFeatureFlagsMiddleware, type PartialFeatures } from "@shared/feature-flags";
import { reducerRegistry } from "@shared/mobile-host-runtime";
import { fetchRemoteFlags } from "~/firebase/remoteConfig";

export const store = configureStore({
  reducer: reducers,
  devTools: Config.DEBUG_RNDEBUGGER
    ? {
        stateSanitizer: <S>(state: S): S => {
          const s = state as Record<string, unknown>;
          const api = s.counterValuesApi as Record<string, unknown> | undefined;
          if (!api?.queries) return state;
          const queries = api.queries as Record<string, unknown>;
          const key = "getCounterValueIdsSortedByMarketCap(undefined)";
          if (!(key in queries)) return state;
          return {
            ...s,
            counterValuesApi: {
              ...api,
              queries: { ...queries, [key]: "<<redacted: ~20k market cap IDs>>" },
            },
          } as S;
        },
      }
    : false,
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
          },
        },
      }),
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

export type StoreType = typeof store;
export type AppDispatch = typeof store.dispatch;

reducerRegistry.attachStore(store);

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
