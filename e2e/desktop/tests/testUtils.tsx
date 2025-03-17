import React from "react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import StyleProvider from "~/renderer/styles/StyleProvider";
import { MemoryRouter } from "react-router-dom";
import { render as rtlRender, renderHook as rtlRenderHook } from "@testing-library/react";
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

config.disabled = true;

interface ChildrenProps {
  children: JSX.Element;
}
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

function render(
  ui: JSX.Element,
  {
    initialState = {},
    //initialRoute = "/",
    store = createStore({ state: { ...(initialState || {}) } as State, dbMiddleware }),
    userEventOptions = {},
    ...renderOptions
  }: ExtraOptions = {},
): RenderReturn {
  const queryClient = new QueryClient();

  function Wrapper({ children }: ChildrenProps): JSX.Element {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <Provider store={store}>
            <DrawerProvider>
              <NftMetadataProvider getCurrencyBridge={getCurrencyBridge}>
                <StyleProvider selectedPalette="dark">
                  <FirebaseFeatureFlagsProvider getFeature={getFeature}>
                    <ContextMenuWrapper>
                      <MemoryRouter>{children}</MemoryRouter>
                    </ContextMenuWrapper>
                  </FirebaseFeatureFlagsProvider>
                </StyleProvider>
              </NftMetadataProvider>
            </DrawerProvider>
          </Provider>
        </I18nextProvider>
      </QueryClientProvider>
    );
  }

  return {
    store,
    user: userEvent.setup(userEventOptions),
    ...rtlRender(ui, { wrapper: Wrapper as React.ComponentType, ...renderOptions }),
  };
}

function renderHook<Result, Props = undefined>(
  hook: (props: Props) => Result,
  {
    initialProps,
    initialState = {},
    //initialRoute = "/",
    store = createStore({ state: { ...(initialState || {}) } as State, dbMiddleware }),
  }: {
    initialProps?: Props;
    initialState?: DeepPartial<State>;
    store?: ReturnType<typeof createStore>;
  } = {},
) {
  const queryClient = new QueryClient();
  function Wrapper({ children }: ChildrenProps): JSX.Element {
    return (
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <FirebaseFeatureFlagsProvider getFeature={getFeature}>
            <MemoryRouter>{children}</MemoryRouter>
          </FirebaseFeatureFlagsProvider>
        </Provider>
      </QueryClientProvider>
    );
  }

  return {
    store,

    ...rtlRenderHook(hook, { wrapper: Wrapper as React.ComponentType, initialProps }),
  };
}

export * from "@testing-library/react";

export { render, userEvent, renderHook };
