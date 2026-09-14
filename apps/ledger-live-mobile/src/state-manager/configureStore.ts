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
  type FeatureFlagsReadFailure,
  type PartialFeatures,
} from "@shared/feature-flags";
import { fetchRemoteFlags, readCachedFlags } from "~/firebase/remoteConfig";
import { sleepingListener } from "./sleepingListener";
import { createPkcePairWithExpoCrypto } from "~/helpers/pkce";

/**
 * Reports only the failures that actually degrade the session. A warm failure is routine: the
 * previously read values stay in place and the next poll retries. A cold one means the app is
 * running on compiled defaults, which is a misconfigured session rather than a passing network
 * blip, and is precisely the signal whose absence let a staging leak run unnoticed for a whole
 * release cycle.
 *
 * `console.error` because it is the level the monitoring tools intercept. Deliberately not the
 * app's `logger.critical`, which despite its name falls back to `console.log` outside
 * `DEBUG_ERROR` builds and so would make this *less* visible than a plain warning. Desktop uses
 * `logger.critical` instead, because there it really is the Datadog path.
 */
function reportFeatureFlagsReadFailure(error: unknown, { stage, isCold }: FeatureFlagsReadFailure) {
  if (!isCold) return;
  console.error(`Feature flags: ${stage} read failed, resolving on compiled defaults`, error);
}

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
              getCardApiBaseUrl: () => getEnv("CARD_BAANX_API_URL"),
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
          readCachedFlags,
          fetchRemoteFlags,
          getAppLanguage: languageSelector,
          onRemoteFlagsError: reportFeatureFlagsReadFailure,
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
