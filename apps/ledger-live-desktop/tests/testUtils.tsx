import React from "react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import StyleProvider from "~/renderer/styles/StyleProvider";
import { HashRouter as Router } from "react-router-dom";
import { render as rtlRender } from "@testing-library/react";
import { type State } from "~/renderer/reducers";
import createStore from "../src/renderer/createStore";
import dbMiddleware from "../src/renderer/middlewares/db";
import { I18nextProvider } from "react-i18next";
import i18n from "~/renderer/i18n/init";

interface ChildrenProps {
  children: JSX.Element;
}
interface ExtraOptions {
  intialState?: {
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
  function Wrapper({ children }: ChildrenProps): JSX.Element {
    return (
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>
          <StyleProvider selectedPalette="dark">
            <Router>{children}</Router>
          </StyleProvider>
        </Provider>
      </I18nextProvider>
    );
  }

  return {
    store,
    user: userEvent.setup(userEventOptions),
    ...rtlRender(ui, { wrapper: Wrapper as React.ComponentType, ...renderOptions }),
  };
}
export * from "@testing-library/react";

export { render, userEvent };
