import { CountervaluesProvider } from "@ledgerhq/live-countervalues-react";
import { CounterValuesStateRaw } from "@ledgerhq/live-countervalues/types";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RenderHookResult,
  render as rtlRender,
  renderHook as rtlRenderHook,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { config } from "react-transition-group";
import ContextMenuWrapper from "~/renderer/components/ContextMenu/ContextMenuWrapper";
import { useCountervaluesBridge } from "~/renderer/components/CountervaluesProvider";
import { FirebaseFeatureFlagsProvider } from "~/renderer/components/FirebaseFeatureFlags";
import type { ReduxStore } from "~/renderer/createStore";
import createStore from "~/renderer/createStore";
import DrawerProvider from "~/renderer/drawers/Provider";
import i18n from "~/renderer/i18n/init";
import dbMiddleware from "~/renderer/middlewares/db";
import { type State } from "~/renderer/reducers";
import StyleProvider from "~/renderer/styles/StyleProvider";
import CustomLiveAppProvider from "./CustomLiveAppProvider";
import { getFeature } from "./featureFlags";
import { initialCountervaluesMock } from "./mocks/countervalues.mock";

config.disabled = true;

interface ExtraOptions {
  initialState?: {
    [key: string]: unknown;
  };
  [key: string]: unknown;
  store?: ReduxStore;
  initialRoute?: string;
  userEventOptions?: Parameters<typeof userEvent.setup>[0];
  skipRouter?: boolean;
}

interface RenderReturn {
  store: ReduxStore;
  user: ReturnType<typeof userEvent.setup>;
  container: HTMLElement;
  i18n: typeof i18n;
  rerender: (ui: React.ReactElement) => void;
}
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends object
      ? { [P in keyof T]?: DeepPartial<T[P]> }
      : T;

config.disabled = true;

function CountervaluesProviders({
  children,
  savedState,
}: {
  children: React.ReactNode;
  savedState?: CounterValuesStateRaw | undefined;
}) {
  const bridge = useCountervaluesBridge();

  return (
    <CountervaluesProvider bridge={bridge} savedState={savedState}>
      {children}
    </CountervaluesProvider>
  );
}

/**
 * A component that wraps the application with necessary context providers.
 * It includes providers such as QueryClientProvider, Redux Provider, FirebaseFeatureFlagsProvider,
 * MemoryRouter, I18nextProvider, DrawerProvider, NftMetadataProvider, and StyleProvider.
 *
 * @param {ProvidersProps} props - The component's props.
 * @param {React.ReactNode} props.children - The child elements to be rendered within the context providers.
 * @param {ReduxStore} props.store - The Redux store to be used with the Provider.
 * @param {boolean} [props.minimal=false] - If true, renders only the children without additional context providers.
 *
 * @returns {React.JSX.Element} The wrapped children with the specified context providers.
 */

function Providers({
  children,
  store,
  minimal = false,
  withLiveApp = false,
  initialCountervalues,
  skipRouter = false,
  initialRoute,
}: {
  children: React.ReactNode;
  store: ReduxStore;
  minimal?: boolean;
  withLiveApp?: boolean;
  initialCountervalues?: CounterValuesStateRaw;
  skipRouter?: boolean;
  initialRoute?: string;
}): React.JSX.Element {
  const queryClient = new QueryClient();

  const content = minimal ? <>{children}</> : <EnhancedProviders>{children}</EnhancedProviders>;

  const routerContent = (
    <CountervaluesProviders savedState={initialCountervalues}>
      {withLiveApp ? <CustomLiveAppProvider>{content}</CustomLiveAppProvider> : content}
    </CountervaluesProviders>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <FirebaseFeatureFlagsProvider getFeature={getFeature}>
          {skipRouter ? (
            routerContent
          ) : (
            <MemoryRouter initialEntries={initialRoute ? [initialRoute] : undefined}>
              {routerContent}
            </MemoryRouter>
          )}
        </FirebaseFeatureFlagsProvider>
      </Provider>
    </QueryClientProvider>
  );
}

function EnhancedProviders({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <I18nextProvider i18n={i18n}>
      <DrawerProvider>
        <StyleProvider selectedPalette="dark">
          <ContextMenuWrapper>{children}</ContextMenuWrapper>
        </StyleProvider>
      </DrawerProvider>
    </I18nextProvider>
  );
}

/**
 * Renders a UI component with the necessary context providers and sets up user events for testing and mocking counter values.
 * This should be merged with the main render function to avoid duplication.
 * But for now, it is kept separate to maintain the mocking of counter values and avoid breaking changes.
 *
 * @param {React.JSX.Element} ui - The React component to be rendered.
 * @param {ExtraOptions} [options={}] - Additional options for rendering, such as initial state, store, etc.
 *
 * @returns {RenderReturn} The rendered component with the provided context providers and user events.
 */
function renderWithMockedCounterValuesProvider(
  ui: React.JSX.Element,
  options: ExtraOptions = {},
): RenderReturn {
  const {
    initialState = {},
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    store = createStore({ state: initialState as State, dbMiddleware }),
    userEventOptions = {},
    skipRouter = false,
    ...renderOptions
  } = options;

  return {
    store,
    i18n,
    user: userEvent.setup(userEventOptions),
    ...rtlRender(ui, {
      wrapper: ({ children }) => (
        <Providers
          store={store}
          initialCountervalues={initialCountervaluesMock}
          skipRouter={skipRouter}
        >
          {children}
        </Providers>
      ),
      ...renderOptions,
    }),
  };
}

/**
 * Renders a UI component with the necessary context providers and sets up user events for testing.
 *
 * @param {React.JSX.Element} ui - The React component to be rendered.
 * @param {ExtraOptions} [options={}] - Additional options for rendering, such as initial state, store, etc.
 *
 * @returns {RenderReturn} The rendered component with the provided context providers and user events.
 */
function render(ui: React.JSX.Element, options: ExtraOptions = {}): RenderReturn {
  const {
    initialState = {},
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    store = createStore({ state: initialState as State, dbMiddleware }),
    userEventOptions = {},
    skipRouter = false,
    initialRoute,
    ...renderOptions
  } = options;

  return {
    store,
    i18n,
    user: userEvent.setup(userEventOptions),
    ...rtlRender(ui, {
      wrapper: ({ children }) => (
        <Providers store={store} skipRouter={skipRouter} initialRoute={initialRoute}>
          {children}
        </Providers>
      ),
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
 * @param {ReduxStore} [options.store] - The Redux store to be used.
 * @param {Boolean} [options.minimal] - Does not include all providers when true.
 *
 * @returns {RenderHookResult<Result, Props>} The rendered hook result with the context providers and store.
 */

function renderHook<Result, Props>(
  hook: (props: Props) => Result,
  options: {
    initialProps?: Props;
    initialState?: DeepPartial<State>;
    store?: ReduxStore;
    minimal?: boolean;
    skipRouter?: boolean;
  } = {},
): RenderHookResult<Result, Props> & { store: ReduxStore } {
  const {
    initialProps,
    initialState = {},
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    store = createStore({ state: initialState as State, dbMiddleware }),
    minimal = true,
    skipRouter = false,
  } = options;

  return {
    store,
    ...rtlRenderHook(hook, {
      wrapper: ({ children }) => (
        <Providers store={store} minimal={minimal} skipRouter={skipRouter}>
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
    store?: ReduxStore;
  } = {},
): RenderHookResult<Result, Props> & { store: ReduxStore } {
  const {
    initialProps,
    initialState = {},
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    store = createStore({ state: initialState as State, dbMiddleware }),
  } = options;

  return {
    store,
    ...rtlRenderHook(hook, {
      wrapper: ({ children }) => (
        <Providers store={store} minimal withLiveApp>
          {children}
        </Providers>
      ),
      initialProps,
    }),
  };
}

// Override act to suppress deprecation warnings for synchronous usage
// eslint-disable-next-line @typescript-eslint/no-deprecated
const actWrapper = (callback: () => void | Promise<void>): void | Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  return act(callback);
};

export * from "@testing-library/react";
export { actWrapper as act };
export {
  render,
  renderHook,
  renderHookWithLiveAppProvider,
  renderWithMockedCounterValuesProvider,
  userEvent,
};
