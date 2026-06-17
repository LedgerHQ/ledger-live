import {
  configureStore,
  createListenerMiddleware,
  Middleware,
  ThunkDispatch,
} from "@reduxjs/toolkit";
import { UnknownAction } from "redux";
import { getEnv } from "@ledgerhq/live-env";
import { AuthSDK } from "@ledgerhq/ledger-auth";
import { LkrpIdentityProvider } from "@ledgerhq/ledger-key-ring-protocol";
import { trustchainStoreActionTypePrefix } from "@ledgerhq/ledger-key-ring-protocol/store";
import logger from "~/renderer/middlewares/logger";
import reducers, { State } from "~/renderer/reducers";
import { applyLldRTKApiMiddlewares } from "~/renderer/reducers/rtkQueryApi";
import { createIdentitiesSyncMiddleware } from "@ledgerhq/client-ids/store";
import { canPushDeviceIdsSelector, languageSelector } from "~/renderer/reducers/settings";
import { createFeatureFlagsMiddleware, type PartialFeatures } from "@shared/feature-flags";
import { fetchRemoteFlags as defaultFetchRemoteFlags } from "~/firebase/remoteConfig";
type Props = {
  state?: State;
  dbMiddleware?: Middleware;
  analyticsMiddleware?: Middleware;
  /**
   * Remote-flags fetcher driving the polling loop. Defaults to the Firebase fetcher.
   * Pass `null` to disable polling (e.g. unit tests, which must not hit a live backend).
   */
  fetchRemoteFlags?: (() => Promise<PartialFeatures>) | null;
};

export type AppExtraArgument = {
  authSDK: AuthSDK;
};

const customCreateStore = ({
  state,
  dbMiddleware,
  analyticsMiddleware,
  fetchRemoteFlags = defaultFetchRemoteFlags,
}: Props) => {
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

  const store = configureStore({
    reducer: reducers,
    preloadedState: state,
    middleware: getDefaultMiddleware =>
      applyLldRTKApiMiddlewares(
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
        .concat(logger)
        .concat(analyticsMiddleware ? [analyticsMiddleware] : [])
        .concat(dbMiddleware ? [dbMiddleware] : [])
        .concat(
          createIdentitiesSyncMiddleware({
            getIdentitiesState: ({ identities }: State) => identities,
            getAnalyticsConsent: canPushDeviceIdsSelector,
          }),
        )
        .concat(
          createFeatureFlagsMiddleware<State>({
            resolutionConfig: {
              platform: "desktop",
              appVersion: __APP_VERSION__,
              envFlags: getEnv("FEATURE_FLAGS") as PartialFeatures,
            },
            fetchRemoteFlags: fetchRemoteFlags ?? undefined,
            getAppLanguage: languageSelector,
          }),
        ),
    devTools: __DEV__,
  });
  syncLkrpIdentityProviderFromState(lkrpIdentityProvider, store.getState());
  return store;
};

export type ReduxStore = ReturnType<typeof customCreateStore>;
export type AppDispatch = ThunkDispatch<State, AppExtraArgument, UnknownAction> &
  ReduxStore["dispatch"];

export default customCreateStore;

function syncLkrpIdentityProviderFromState(
  lkrpIdentityProvider: LkrpIdentityProvider,
  { trustchain }: State,
): void {
  lkrpIdentityProvider.setKeypair(trustchain.memberCredentials ?? undefined);
  lkrpIdentityProvider.setTrustchainId(trustchain.trustchain?.rootId);
}
