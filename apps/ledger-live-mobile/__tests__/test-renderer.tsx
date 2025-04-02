import React from "react";
import {
  render as rntlRender,
  RenderOptions,
  userEvent,
  renderHook as rntlRenderHook,
} from "@testing-library/react-native";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { NavigationContainer } from "@react-navigation/native";
import { initialState as POST_ONBOARDING_INITIAL_STATE } from "@ledgerhq/live-common/postOnboarding/reducer";
import { AnalyticsContextProvider } from "~/analytics/AnalyticsContext";
import { FirebaseFeatureFlagsProvider } from "~/components/FirebaseFeatureFlags";
import { getFeature } from "./featureFlags";
import { i18n } from "~/context/Locale";
import { configureStore } from "@reduxjs/toolkit";
import reducers from "~/reducers";
import StyleProvider from "~/StyleProvider";
import { State } from "~/reducers/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { INITIAL_STATE as ACCOUNTS_INITIAL_STATE } from "~/reducers/accounts";
import { INITIAL_STATE as SETTINGS_INITIAL_STATE } from "~/reducers/settings";
import { INITIAL_STATE as APP_STATE_INITIAL_STATE } from "~/reducers/appstate";
import { INITIAL_STATE as BLE_INITIAL_STATE } from "~/reducers/ble";
import { INITIAL_STATE as RATINGS_INITIAL_STATE } from "~/reducers/ratings";
import { INITIAL_STATE as NOTIFICATIONS_INITIAL_STATE } from "~/reducers/notifications";
import { INITIAL_STATE as SWAP_INITIAL_STATE } from "~/reducers/swap";
import { INITIAL_STATE as EARN_INITIAL_STATE } from "~/reducers/earn";
import { INITIAL_STATE as DYNAMIC_CONTENT_INITIAL_STATE } from "~/reducers/dynamicContent";
import { INITIAL_STATE as WALLET_CONNECT_INITIAL_STATE } from "~/reducers/walletconnect";
import { INITIAL_STATE as PROTECT_INITIAL_STATE } from "~/reducers/protect";
import { INITIAL_STATE as NFT_INITIAL_STATE } from "~/reducers/nft";
import { INITIAL_STATE as MARKET_INITIAL_STATE } from "~/reducers/market";
import { INITIAL_STATE as WALLETSYNC_INITIAL_STATE } from "~/reducers/walletSync";

import { initialState as WALLET_INITIAL_STATE } from "@ledgerhq/live-wallet/store";
import QueuedDrawersContextProvider from "LLM/components/QueuedDrawer/QueuedDrawersContextProvider";
import { INITIAL_STATE as TRUSTCHAIN_INITIAL_STATE } from "@ledgerhq/ledger-key-ring-protocol/store";
import CustomLiveAppProvider from "./CustomLiveAppProvider";

const initialState = {
  accounts: ACCOUNTS_INITIAL_STATE,
  settings: SETTINGS_INITIAL_STATE,
  appstate: APP_STATE_INITIAL_STATE,
  ble: BLE_INITIAL_STATE,
  ratings: RATINGS_INITIAL_STATE,
  dynamicContent: DYNAMIC_CONTENT_INITIAL_STATE,
  notifications: NOTIFICATIONS_INITIAL_STATE,
  swap: SWAP_INITIAL_STATE,
  earn: EARN_INITIAL_STATE,
  walletconnect: WALLET_CONNECT_INITIAL_STATE,
  postOnboarding: POST_ONBOARDING_INITIAL_STATE,
  protect: PROTECT_INITIAL_STATE,
  nft: NFT_INITIAL_STATE,
  market: MARKET_INITIAL_STATE,
  wallet: WALLET_INITIAL_STATE,
  trustchain: TRUSTCHAIN_INITIAL_STATE,
  walletSync: WALLETSYNC_INITIAL_STATE,
};

type ExtraOptions = RenderOptions & {
  overrideInitialState?: (state: State) => State;
  userEventOptions?: Parameters<typeof userEvent.setup>[0];
};

enum RenderType {
  DEFAULT = "default",
  HOOK = "hook",
}

function createStore({ overrideInitialState }: { overrideInitialState: (state: State) => State }) {
  return configureStore({
    reducer: reducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({ serializableCheck: false, immutableCheck: false }),
    preloadedState: overrideInitialState(initialState),
    devTools: false,
  });
}

/**
 * Provides context providers for the application, conditionally including certain providers
 * based on the render type and feature flags.
 *
 * @param {Object} props - The properties for the Providers component.
 * @param {React.ReactNode} props.children - The child components to be wrapped by the providers.
 * @param {ReturnType<typeof createStore>} props.store - The Redux store instance.
 * @param {boolean} [props.withReactQuery=false] - Whether to include React Query's QueryClientProvider.
 * @param {boolean} [props.withLiveApp=false] - Whether to include the CustomLiveAppProvider.
 * @param {RenderType} [props.renderType=RenderType.DEFAULT] - The type of rendering context; determines which providers are included.
 * @returns {JSX.Element} A JSX element containing the necessary providers.
 */
function Providers({
  children,
  store,
  withReactQuery = false,
  withLiveApp = false,
  renderType = RenderType.DEFAULT,
}: {
  children: React.ReactNode;
  store: ReturnType<typeof createStore>;
  withReactQuery?: boolean;
  withLiveApp?: boolean;
  renderType?: RenderType;
}): JSX.Element {
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
          <QueuedDrawersContextProvider>
            <AnalyticsContextProvider>{content}</AnalyticsContextProvider>
          </QueuedDrawersContextProvider>
        </I18nextProvider>
      </StyleProvider>
    );

  // General Providers needed for all render types
  let providers = (
    <Provider store={store}>
      <FirebaseFeatureFlagsProvider getFeature={getFeature}>
        {extraProviders}
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
  ui: React.ReactElement,
  {
    overrideInitialState: overrideInitialState = state => state,
    userEventOptions = {},
    ...renderOptions
  }: ExtraOptions = {},
) => {
  const store = createStore({
    overrideInitialState,
  });

  const ProvidersWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <Providers store={store}>{children}</Providers>;
  };

  return {
    user: userEvent.setup(userEventOptions),
    ...rntlRender(ui, { wrapper: ProvidersWrapper, ...renderOptions }),
  };
};

const renderWithReactQuery = (
  ui: React.ReactElement,
  {
    overrideInitialState: overrideInitialState = state => state,
    userEventOptions = {},
    ...renderOptions
  }: ExtraOptions = {},
) => {
  const store = createStore({
    overrideInitialState,
  });

  const ProvidersWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  const ProvidersWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

  const ProvidersWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  customRender as render,
  customRenderHook as renderHook,
  renderWithReactQuery,
  customRenderHookWithLiveAppProvider,
};
