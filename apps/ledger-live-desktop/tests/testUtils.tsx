import React from "react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import StyleProviderV2 from "~/renderer/styles/StyleProviderV2";
import { HashRouter as Router } from "react-router-dom";
import { render as rtlRender } from "@testing-library/react";
import { type State } from "~/renderer/reducers";
import createStore from "../src/renderer/createStore";
import dbMiddleware from "../src/renderer/middlewares/db";

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
  function Wrapper({ children }: ChildrenProps) {
    return (
      <Provider store={store}>
        <StyleProviderV2 selectedPalette="dark">
          <Router>{children}</Router>
        </StyleProviderV2>
      </Provider>
    );
  }
  return {
    store,
    user: userEvent.setup(userEventOptions),
    ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
export * from "@testing-library/react";

export { render, userEvent };
