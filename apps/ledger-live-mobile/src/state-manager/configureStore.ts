import Config from "react-native-config";
import RNRestart from "react-native-restart";
import { configureStore, type StoreEnhancer } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { createAppConfigMiddleware } from "@shared/app-config";
import reducers from "~/reducers";
import { subscribeToNetworkState } from "@shared/network-status";
import { rebootMiddleware } from "~/middleware/rebootMiddleware";
import { rozeniteDevToolsEnhancer } from "@rozenite/redux-devtools-plugin";
import { apiServices, applyLlmRTKApiMiddlewares } from "~/context/rtkQueryApi";
import { setupCryptoAssetsStore, setupRateLookups } from "~/config/bridge-setup";
import { setSwapQuotesStore } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/state-manager/store";
import { connectRecentAddressesStore } from "@domain/entity-recent-addresses";
import { syncFirmwareDistributionSalt } from "@ledgerhq/live-dmk-shared";
import { setFirmwareDistributionSalt } from "@ledgerhq/live-dmk-mobile";
import { setIdentitiesStore } from "@ledgerhq/live-common/device/firmwareDistributionSalt";
import { recentAddressesSelector } from "~/reducers/wallet";
import { createIdentitiesSyncMiddleware } from "@domain/api-push-devices";
import { accountDataExtra } from "@domain/api-account-data";
import { accountDataSources, connectAccounts } from "~/config/account-data-setup";
import { State } from "~/reducers/types";
import { canPushDeviceIdsSelector } from "~/reducers/settings";
import { getEnv } from "@shared/env";
import { cardApi, redactCardApiAction, redactCardApiState } from "@shared/api-services";
import { configureCardSessionRenewal } from "@features/platform-card";
import { setSignedIn } from "@features/flow-pay-card-auth/state";
import { appConfig, appConfigSession } from "~/setup";
import { sleepingListener } from "./sleepingListener";
import { createMobileFeatureFlagsMiddleware } from "./middleware/feature-flags";
import { createMobileCountervaluesMiddleware } from "./middleware/countervalues";
import { createMobileAuthMiddleware } from "./middleware/auth";

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
            ...accountDataExtra(
              accountDataSources(
                (): State => store.getState(),
                (action): unknown => store.dispatch(action),
              ),
            ),
            ...apiServices.createExtra({ ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION") }),
          },
        },
      }),
    )
      .concat(createMobileAuthMiddleware(appConfig))
      .concat(rebootMiddleware)
      .concat(
        createIdentitiesSyncMiddleware({
          pushDevicesServiceUrl: getEnv("PUSH_DEVICES_SERVICE_URL").trim(),
          getIdentitiesState: (state: State) => state.identities,
          getAnalyticsConsent: canPushDeviceIdsSelector,
        }),
      )
      .concat(
        createAppConfigMiddleware({ session: appConfigSession, reload: () => RNRestart.restart() }),
      )
      .concat(createMobileFeatureFlagsMiddleware())
      .concat(sleepingListener.middleware)
      .concat(createMobileCountervaluesMiddleware()),

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

setupListeners(store.dispatch, (dispatch, { onOnline, onOffline }) =>
  subscribeToNetworkState(state => {
    if (state.isConnected) {
      dispatch(onOnline());
    } else {
      dispatch(onOffline());
    }
  }),
);
connectRecentAddressesStore(store, recentAddressesSelector);
connectAccounts(store);
setupCryptoAssetsStore(store);
setupRateLookups();
setSwapQuotesStore(store.dispatch);
syncFirmwareDistributionSalt(store, setFirmwareDistributionSalt);
setIdentitiesStore(store);
