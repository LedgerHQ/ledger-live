import React from "react";
import { renderHook, type RenderHookResult } from "@testing-library/react";
import { Provider } from "react-redux";
import createStore, { type ReduxStore } from "~/state-manager/configureStore";

export const renderHookWithStore = <TResult, TProps = void>(
  callback: (props: TProps) => TResult,
  options?: { initialProps?: TProps },
): RenderHookResult<TResult, TProps> & { store: ReduxStore } => {
  const store = createStore({});
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
  const hook = renderHook(callback, { wrapper, ...options });
  return { ...hook, store };
};
