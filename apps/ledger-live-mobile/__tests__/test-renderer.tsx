import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { initialIdentitiesState } from "@ledgerhq/client-ids/store";
import { INITIAL_STATE as TRUSTCHAIN_INITIAL_STATE } from "@ledgerhq/ledger-key-ring-protocol/store";
import { initialState as POST_ONBOARDING_INITIAL_STATE } from "@ledgerhq/live-common/postOnboarding/reducer";
import { CountervaluesBridge, CountervaluesProvider } from "@ledgerhq/live-countervalues-react";
import { initialState as WALLET_INITIAL_STATE } from "@ledgerhq/live-wallet/store";
import { NavigationContainer } from "@react-navigation/native";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RenderOptions,
  render as rntlRender,
  renderHook as rntlRenderHook,
  userEvent,
} from "@testing-library/react-native";
import QueuedDrawersContextProvider from "LLM/components/QueuedDrawer/QueuedDrawersContextProvider";
import React, { useMemo } from "react";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { AnalyticsContextProvider } from "~/analytics/AnalyticsContext";
import { CountervaluesMarketcapBridgedProvider } from "~/components/CountervaluesMarketcapProvider";
import { FirebaseFeatureFlagsProvider } from "~/components/FirebaseFeatureFlags";
import { i18n } from "~/context/Locale";
import reducers from "~/reducers";
import { INITIAL_STATE as ACCOUNTS_INITIAL_STATE } from "~/reducers/accounts";
import { INITIAL_STATE as APP_STATE_INITIAL_STATE } from "~/reducers/appstate";
import { INITIAL_STATE as BLE_INITIAL_STATE } from "~/reducers/ble";
import { INITIAL_STATE as COUNTERVALUES_INITIAL_STATE } from "~/reducers/countervalues";
import { INITIAL_STATE as DYNAMIC_CONTENT_INITIAL_STATE } from "~/reducers/dynamicContent";
import { INITIAL_STATE as EARN_INITIAL_STATE } from "~/reducers/earn";
import { INITIAL_STATE as IN_VIEW_INITIAL_STATE } from "~/reducers/inView";
import { LARGE_MOVER_INITIAL_STATE } from "~/reducers/largeMover";
import { INITIAL_STATE as MARKET_INITIAL_STATE } from "~/reducers/market";
import { INITIAL_STATE as MODULAR_DRAWER_INITIAL_STATE } from "~/reducers/modularDrawer";
import { INITIAL_STATE as NOTIFICATIONS_INITIAL_STATE } from "~/reducers/notifications";
import { INITIAL_STATE as PROTECT_INITIAL_STATE } from "~/reducers/protect";
import { INITIAL_STATE as RATINGS_INITIAL_STATE } from "~/reducers/ratings";
import { INITIAL_STATE as RECEIVE_OPTIONS_DRAWER_INITIAL_STATE } from "~/reducers/receiveOptionsDrawer";
import { INITIAL_STATE as TRANSFER_DRAWER_INITIAL_STATE } from "~/reducers/transferDrawer";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/reducers/settings";
import { INITIAL_STATE as TOASTS_INITIAL_STATE } from "~/reducers/toast";
import { State } from "~/reducers/types";
import { INITIAL_STATE as WALLET_CONNECT_INITIAL_STATE } from "~/reducers/walletconnect";
import { INITIAL_STATE as WALLETSYNC_INITIAL_STATE } from "~/reducers/walletSync";
import { INITIAL_STATE as AUTH_INITIAL_STATE } from "~/reducers/auth";
import { INITIAL_STATE as SEND_FLOW_INITIAL_STATE } from "~/reducers/sendFlow";
import StyleProvider from "~/StyleProvider";
import CustomLiveAppProvider from "./CustomLiveAppProvider";
import { getFeature } from "./featureFlags";
import { llmRtkApiInitialStates, applyLlmRTKApiMiddlewares } from "~/context/rtkQueryApi";

const INITIAL_STATE: State = {
  accounts: ACCOUNTS_INITIAL_STATE,
  appstate: APP_STATE_INITIAL_STATE,
  ble: BLE_INITIAL_STATE,
  countervalues: COUNTERVALUES_INITIAL_STATE,
  dynamicContent: DYNAMIC_CONTENT_INITIAL_STATE,
  earn: EARN_INITIAL_STATE,
  identities: initialIdentitiesState,
  inView: IN_VIEW_INITIAL_STATE,
  largeMover: LARGE_MOVER_INITIAL_STATE,
  market: MARKET_INITIAL_STATE,
  modularDrawer: MODULAR_DRAWER_INITIAL_STATE,
  receiveOptionsDrawer: RECEIVE_OPTIONS_DRAWER_INITIAL_STATE,
  transferDrawer: TRANSFER_DRAWER_INITIAL_STATE,
  notifications: NOTIFICATIONS_INITIAL_STATE,
  postOnboarding: POST_ONBOARDING_INITIAL_STATE,
  protect: PROTECT_INITIAL_STATE,
  ratings: RATINGS_INITIAL_STATE,
  settings: SETTINGS_INITIAL_STATE,
  toasts: TOASTS_INITIAL_STATE,
  trustchain: TRUSTCHAIN_INITIAL_STATE,
  wallet: WALLET_INITIAL_STATE,
  walletconnect: WALLET_CONNECT_INITIAL_STATE,
  walletSync: WALLETSYNC_INITIAL_STATE,
  auth: AUTH_INITIAL_STATE,
  sendFlow: SEND_FLOW_INITIAL_STATE,
  ...llmRtkApiInitialStates,
};

type ExtraOptions = RenderOptions & {
  overrideInitialState?: (state: State) => State;
  userEventOptions?: Parameters<typeof userEvent.setup>[0];
};

enum RenderType {
  DEFAULT = "default",
  HOOK = "hook",
}

type NavigationChildren = React.ComponentProps<typeof NavigationContainer>["children"];
type CountervaluesChildren = React.ComponentProps<typeof CountervaluesProvider>["children"];
type WrapperProps = { children?: NavigationChildren };

function createStore({ overrideInitialState }: { overrideInitialState: (state: State) => State }) {
  return configureStore({
    reducer: reducers,
    middleware: getDefaultMiddleware =>
      applyLlmRTKApiMiddlewares(
        getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
      ),
    preloadedState: overrideInitialState(INITIAL_STATE),
    devTools: false,
  });
}

export type ReduxStore = ReturnType<typeof createStore>;

function CountervaluesProviders({
  children,
  store,
}: {
  children: CountervaluesChildren;
  store: ReduxStore;
}): React.JSX.Element {
  // TODO This interim bridge is only a stop-gap. We’ll remove it once we either:
  // (a) separate counter-values user settings from the Firebase feature flag, or
  // (b) introduce a proper feature-flag provider that doesn’t break our tests.
  const bridge = useMemo((): CountervaluesBridge => {
    const state = store.getState();
    return {
      setPollingIsPolling: () => {},
      setPollingTriggerLoad: () => {},
      setState: () => {},
      setStateError: () => {},
      setStatePending: () => {},
      usePollingIsPolling: () => false,
      usePollingTriggerLoad: () => false,
      useState: () => state.countervalues.countervalues.state,
      useStateError: () => null,
      useStatePending: () => false,
      useUserSettings: () => state.countervalues.userSettings,
      wipe: () => {},
    };
  }, [store]);

  return (
    <CountervaluesMarketcapBridgedProvider>
      <CountervaluesProvider bridge={bridge}>{children}</CountervaluesProvider>
    </CountervaluesMarketcapBridgedProvider>
  );
}

/**
 * Provides context providers for the application, conditionally including certain providers
 * based on the render type and feature flags.
 *
 * @param {Object} props - The properties for the Providers component.
 * @param {React.ReactNode} props.children - The child components to be wrapped by the providers.
 * @param {ReturnType<ReduxStore>} props.store - The Redux store instance.
 * @param {boolean} [props.withReactQuery=false] - Whether to include React Query's QueryClientProvider.
 * @param {boolean} [props.withLiveApp=false] - Whether to include the CustomLiveAppProvider.
 * @param {RenderType} [props.renderType=RenderType.DEFAULT] - The type of rendering context; determines which providers are included.
 * @returns {React.JSX.Element} A JSX element containing the necessary providers.
 */
function Providers({
  children,
  store,
  withReactQuery = false,
  withLiveApp = false,
  renderType = RenderType.DEFAULT,
}: {
  children: NavigationChildren;
  store: ReduxStore;
  withReactQuery?: boolean;
  withLiveApp?: boolean;
  renderType?: RenderType;
}): React.JSX.Element {
  // Custom live app provider
  const content = withLiveApp ? (
    <CustomLiveAppProvider>
      <NavigationContainer>{children}</NavigationContainer>
    </CustomLiveAppProvider>
  ) : (
    <NavigationContainer>{children}</NavigationContainer>
  );

  // Conditionally wraps content with additional providers unless using hook-based rendering
  const extraProviders =
    renderType === RenderType.HOOK ? (
      // For Hook-based rendering, add new providers here
      content
    ) : (
      // For default rendering, add new providers here
      <StyleProvider selectedPalette="dark">
        <I18nextProvider i18n={i18n}>
          <BottomSheetModalProvider>
            <QueuedDrawersContextProvider>
              <AnalyticsContextProvider>{content}</AnalyticsContextProvider>
            </QueuedDrawersContextProvider>
          </BottomSheetModalProvider>
        </I18nextProvider>
      </StyleProvider>
    );

  // General Providers needed for all render types
  let providers = (
    <Provider store={store}>
      <FirebaseFeatureFlagsProvider getFeature={getFeature}>
        <CountervaluesProviders store={store}>{extraProviders}</CountervaluesProviders>
      </FirebaseFeatureFlagsProvider>
    </Provider>
  );

  //if React Query is needed
  if (withReactQuery) {
    const queryClient = new QueryClient();
    providers = <QueryClientProvider client={queryClient}>{providers}</QueryClientProvider>;
  }

  return providers;
}

const customRender = (
  ui: Parameters<typeof rntlRender>[0],
  {
    overrideInitialState: overrideInitialState = state => state,
    userEventOptions = {},
    ...renderOptions
  }: ExtraOptions = {},
) => {
  const store = createStore({
    overrideInitialState,
  });

  const ProvidersWrapper = ({ children }: WrapperProps): React.JSX.Element => {
    return <Providers store={store}>{children}</Providers>;
  };

  return {
    store,
    user: userEvent.setup(userEventOptions),
    ...rntlRender(ui, { wrapper: ProvidersWrapper, ...renderOptions }),
  };
};

const renderWithReactQuery = (
  ui: Parameters<typeof rntlRender>[0],
  {
    overrideInitialState: overrideInitialState = state => state,
    userEventOptions = {},
    ...renderOptions
  }: ExtraOptions = {},
) => {
  const store = createStore({
    overrideInitialState,
  });

  const ProvidersWrapper = ({ children }: WrapperProps): React.JSX.Element => {
    return (
      <Providers store={store} withReactQuery>
        {children}
      </Providers>
    );
  };

  return {
    store,
    user: userEvent.setup(userEventOptions),
    ...rntlRender(ui, { wrapper: ProvidersWrapper, ...renderOptions }),
  };
};

const customRenderHook = <Result,>(
  hook: () => Result,
  {
    overrideInitialState: overrideInitialState = state => state,
    ...renderOptions
  }: ExtraOptions = {},
) => {
  const store = createStore({
    overrideInitialState,
  });
  const ProvidersWrapper = ({ children }: WrapperProps): React.JSX.Element => {
    return (
      <Providers store={store} renderType={RenderType.HOOK}>
        {children}
      </Providers>
    );
  };

  return { store, ...rntlRenderHook(hook, { wrapper: ProvidersWrapper, ...renderOptions }) };
};

const customRenderHookWithLiveAppProvider = <Result,>(
  hook: () => Result,
  {
    overrideInitialState: overrideInitialState = state => state,
    ...renderOptions
  }: ExtraOptions = {},
) => {
  const store = createStore({
    overrideInitialState,
  });

  const ProvidersWrapper = ({ children }: WrapperProps): React.JSX.Element => {
    return (
      <Providers store={store} renderType={RenderType.HOOK} withLiveApp>
        {children}
      </Providers>
    );
  };

  return { store, ...rntlRenderHook(hook, { wrapper: ProvidersWrapper, ...renderOptions }) };
};

export const LONG_TIMEOUT = 30000;

// re-export everything
export * from "@testing-library/react-native";

// override render method
export {
  customRenderHookWithLiveAppProvider,
  customRender as render,
  customRenderHook as renderHook,
  renderWithReactQuery,
};
