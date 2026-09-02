import Config from "react-native-config";
import { configureStore, type StoreEnhancer } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { authApiExtra, authEnvironmentSelector } from "@shared/auth";
import { AuthSDK } from "@ledgerhq/ledger-auth";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import type { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import NetInfo from "@react-native-community/netinfo";
import { Platform } from "react-native";
import VersionNumber from "react-native-version-number";
import reducers from "~/reducers";
import { rebootMiddleware } from "~/middleware/rebootMiddleware";
import { rozeniteDevToolsEnhancer } from "@rozenite/redux-devtools-plugin";
import { applyLlmRTKApiMiddlewares } from "~/context/rtkQueryApi";
import { setupCryptoAssetsStore } from "~/config/bridge-setup";
import { setSwapQuotesStore } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/state-manager/store";
import { connectRecentAddressesStore } from "@domain/entity-recent-addresses";
import { recentAddressesSelector } from "~/reducers/wallet";
import { createIdentitiesSyncMiddleware } from "@domain/api-push-devices";
import { State } from "~/reducers/types";
import { canPushDeviceIdsSelector, languageSelector } from "~/reducers/settings";
import { getEnv } from "@shared/env";
import {
  calApiExtra,
  cardApi,
  cardApiExtra,
  coinMarketCapApiExtra,
  cvsApiExtra,
  pushDevicesApiExtra,
  redactCardApiAction,
  redactCardApiState,
  swapApiExtra,
} from "@shared/api-services";
import {
  configureCardSessionRenewal,
  isCardSessionCurrent,
  readCardSession,
  refreshCardSession,
} from "@features/platform-card";
import { setSignedIn } from "@features/flow-pay-card-auth/state";
import {
  createFeatureFlagsMiddleware,
  selectFeature,
  type PartialFeatures,
} from "@shared/feature-flags";
import { fetchRemoteFlags } from "~/firebase/remoteConfig";
import { sleepingListener } from "./sleepingListener";
import { createPkcePairWithExpoCrypto } from "~/helpers/pkce";

export const store = configureStore({
  reducer: reducers,
  devTools: Config.DEBUG_RNDEBUGGER
    ? { actionSanitizer: redactCardApiAction, stateSanitizer: redactCardApiState }
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
            ...coinMarketCapApiExtra({
              coinMarketCapApiUrl: getEnv("CMC_API_URL"),
            }),
            ...cardApiExtra({
              // Read on every request, so the debug settings can change them without a restart.
              getCardApiBaseUrl: () => getEnv("CARD_API_URL"),
              getCardBaanxClientKey: () => getEnv("CARD_BAANX_CLIENT_KEY"),
              readCardSession,
              isCardSessionCurrent,
              refreshCardSession,
            }),
            ...pushDevicesApiExtra({
              pushDevicesServiceUrl: getEnv("PUSH_DEVICES_SERVICE_URL"),
              ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
            }),
            ...swapApiExtra({
              swapApiBaseUrl: getEnv("SWAP_API_BASE"),
              ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION"),
            }),
            ...authApiExtra({
              isFeatureEnabled: (): boolean =>
                selectFeature(store.getState(), "lwmAuth").enabled ?? false,
              authProvider: new AuthSDK(
                {
                  clientId: getEnv("LEDGER_AUTH_CLIENT_ID"),
                  keycloakBaseUrl(): string | null {
                    const environment = authEnvironmentSelector(store.getState());
                    return environment && getEnv(`LEDGER_AUTH_KEYCLOAK_BASE_URL_${environment}`);
                  },
                  keycloakRealm: getEnv("LEDGER_AUTH_KEYCLOAK_REALM"),
                  disablePkce: true,
                },
                {
                  provider: new LkrpIdentityProvider(
                    (): TrustchainStore => store.getState().trustchain,
                  ),
                  createPkcePair: createPkcePairWithExpoCrypto,
                },
              ),
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
      )
      .concat(sleepingListener.middleware),

  enhancers: getDefaultEnhancers => {
    const enhancers = getDefaultEnhancers();
    const devTools = rozeniteDevToolsEnhancer({
      actionSanitizer: redactCardApiAction,
      stateSanitizer: redactCardApiState,
    });
    // Type assertion needed due to Redux version compatibility types between v4 and v5
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return enhancers.concat(devTools as StoreEnhancer);
  },
});

export type StoreType = typeof store;
export type AppDispatch = typeof store.dispatch;

configureCardSessionRenewal({
  dispatch: store.dispatch,
  onCardSessionEnded: () => {
    store.dispatch(setSignedIn(false));
    setTimeout(() => store.dispatch(cardApi.util.resetApiState()), 0);
  },
});

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
connectRecentAddressesStore(store, recentAddressesSelector);
setupCryptoAssetsStore(store);
setSwapQuotesStore(store.dispatch);
