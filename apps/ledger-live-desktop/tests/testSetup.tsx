import React from "react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import StyleProvider from "~/renderer/styles/StyleProvider";
import { MemoryRouter } from "react-router-dom";
import {
  render as rtlRender,
  renderHook as rtlRenderHook,
  RenderHookResult,
} from "@testing-library/react";
import { type State } from "~/renderer/reducers";
import createStore from "~/renderer/createStore";
import dbMiddleware from "~/renderer/middlewares/db";
import { I18nextProvider } from "react-i18next";
import i18n from "~/renderer/i18n/init";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "react-transition-group";
import { NftMetadataProvider } from "@ledgerhq/live-nft-react";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import DrawerProvider from "~/renderer/drawers/Provider";
import { FirebaseFeatureFlagsProvider } from "~/renderer/components/FirebaseFeatureFlags";
import { getFeature } from "./featureFlags";
import ContextMenuWrapper from "~/renderer/components/ContextMenu/ContextMenuWrapper";
import CustomLiveAppProvider from "./CustomLiveAppProvider";

config.disabled = true;

interface ExtraOptions {
  initialState?: {
    [key: string]: unknown;
  };
  [key: string]: unknown;
  store?: ReturnType<typeof createStore>;
  initialRoute?: string;
  userEventOptions?: Parameters<typeof userEvent.setup>[0];
}

interface RenderReturn {
  store: ReturnType<typeof createStore>;
  user: ReturnType<typeof userEvent.setup>;
}
type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [P in keyof T]?: DeepPartial<T[P]> }
      : T;

config.disabled = true;

/**
 * A component that wraps the application with necessary context providers.
 * It includes providers such as QueryClientProvider, Redux Provider, FirebaseFeatureFlagsProvider,
 * MemoryRouter, I18nextProvider, DrawerProvider, NftMetadataProvider, and StyleProvider.
 *
 * @param {ProvidersProps} props - The component's props.
 * @param {React.ReactNode} props.children - The child elements to be rendered within the context providers.
 * @param {ReturnType<typeof createStore>} props.store - The Redux store to be used with the Provider.
 * @param {boolean} [props.minimal=false] - If true, renders only the children without additional context providers.
 *
 * @returns {JSX.Element} The wrapped children with the specified context providers.
 */

function Providers({
  children,
  store,
  minimal = false,
  withLiveApp = false,
}: {
  children: React.ReactNode;
  store: ReturnType<typeof createStore>;
  minimal?: boolean;
  withLiveApp?: boolean;
}): JSX.Element {
  const queryClient = new QueryClient();

  const content = minimal ? <>{children}</> : <EnhancedProviders>{children}</EnhancedProviders>;

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <FirebaseFeatureFlagsProvider getFeature={getFeature}>
          <MemoryRouter>
            {withLiveApp ? <CustomLiveAppProvider>{content}</CustomLiveAppProvider> : content}
          </MemoryRouter>
        </FirebaseFeatureFlagsProvider>
      </Provider>
    </QueryClientProvider>
  );
}

function EnhancedProviders({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <I18nextProvider i18n={i18n}>
      <DrawerProvider>
        <NftMetadataProvider getCurrencyBridge={getCurrencyBridge}>
          <StyleProvider selectedPalette="dark">
            <ContextMenuWrapper>{children}</ContextMenuWrapper>
          </StyleProvider>
        </NftMetadataProvider>
      </DrawerProvider>
    </I18nextProvider>
  );
}

/**
 * Renders a UI component with the necessary context providers and sets up user events for testing.
 *
 * @param {JSX.Element} ui - The React component to be rendered.
 * @param {ExtraOptions} [options={}] - Additional options for rendering, such as initial state, store, etc.
 *
 * @returns {RenderReturn} The rendered component with the provided context providers and user events.
 */
function render(ui: JSX.Element, options: ExtraOptions = {}): RenderReturn {
  const {
    initialState = {},
    store = createStore({ state: initialState as State, dbMiddleware }),
    userEventOptions = {},
    ...renderOptions
  } = options;

  return {
    store,
    user: userEvent.setup(userEventOptions),
    ...rtlRender(ui, {
      wrapper: ({ children }) => <Providers store={store}>{children}</Providers>,
      ...renderOptions,
    }),
  };
}

/**
 * Renders a custom hook with necessary context providers.
 * Allows testing of custom hooks by providing the necessary context providers.
 *
 * @param {Function} hook - The hook to be rendered.
 * @param {Object} [options={}] - Options to configure the rendering, including initial state and props.
 * @param {Props} [options.initialProps] - The initial props to be passed to the hook.
 * @param {DeepPartial<State>} [options.initialState] - The initial state for the Redux store.
 * @param {ReturnType<typeof createStore>} [options.store] - The Redux store to be used.
 *
 * @returns {RenderHookResult<Result, Props>} The rendered hook result with the context providers and store.
 */

function renderHook<Result, Props>(
  hook: (props: Props) => Result,
  options: {
    initialProps?: Props;
    initialState?: DeepPartial<State>;
    store?: ReturnType<typeof createStore>;
  } = {},
): RenderHookResult<Result, Props> & { store: ReturnType<typeof createStore> } {
  const {
    initialProps,
    initialState = {},
    store = createStore({ state: initialState as State, dbMiddleware }),
  } = options;

  return {
    store,
    ...rtlRenderHook(hook, {
      wrapper: ({ children }) => (
        <Providers store={store} minimal>
          {children}
        </Providers>
      ),
      initialProps,
    }),
  };
}

function renderHookWithLiveAppProvider<Result, Props>(
  hook: (props: Props) => Result,
  options: {
    initialProps?: Props;
    initialState?: DeepPartial<State>;
    store?: ReturnType<typeof createStore>;
  } = {},
): RenderHookResult<Result, Props> & { store: ReturnType<typeof createStore> } {
  const {
    initialProps,
    initialState = {},
    store = createStore({ state: initialState as State, dbMiddleware }),
  } = options;

  return {
    store,
    ...rtlRenderHook(hook, {
      wrapper: ({ children }) => (
        <Providers store={store} withLiveApp>
          {children}
        </Providers>
      ),
      initialProps,
    }),
  };
}

export * from "@testing-library/react";
export { userEvent, render, renderHook, renderHookWithLiveAppProvider };
