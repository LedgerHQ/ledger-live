import React from "react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import StyleProvider from "~/renderer/styles/StyleProvider";
import { MemoryRouter } from "react-router-dom";
import {
  RenderHookResult,
  render as rtlRender,
  renderHook as rtlRenderHook,
} from "@testing-library/react";
import { type State } from "~/renderer/reducers";
import createStore from "../src/renderer/createStore";
import dbMiddleware from "../src/renderer/middlewares/db";
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
import { ExtraOptions, RenderReturn } from "./types";

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
}: {
  children: React.ReactNode;
  store: ReturnType<typeof createStore>;
  minimal?: boolean;
}): JSX.Element {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <FirebaseFeatureFlagsProvider getFeature={getFeature}>
          <MemoryRouter>
            {minimal ? (
              children
            ) : (
              <I18nextProvider i18n={i18n}>
                <DrawerProvider>
                  <NftMetadataProvider getCurrencyBridge={getCurrencyBridge}>
                    <StyleProvider selectedPalette="dark">
                      <ContextMenuWrapper>{children}</ContextMenuWrapper>
                    </StyleProvider>
                  </NftMetadataProvider>
                </DrawerProvider>
              </I18nextProvider>
            )}
          </MemoryRouter>
        </FirebaseFeatureFlagsProvider>
      </Provider>
    </QueryClientProvider>
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
 * @param {ExtraOptions} [options={}] - Options to configure the rendering, including initial state and props.
 * @param {Props} [options.initialProps] - The initial props to be passed to the hook.
 * @param {Partial<State>} [options.initialState] - The initial state for the Redux store.
 * @param {ReturnType<typeof createStore>} [options.store] - The Redux store to be used.
 *
 * @returns {RenderHookResult<Result, Props>} The rendered hook result with the context providers and store.
 */

function renderHook<Result, Props>(
  hook: (props: Props) => Result,
  options: { initialProps?: Props } & ExtraOptions = {},
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

export * from "@testing-library/react";
export { render, userEvent, renderHook };
