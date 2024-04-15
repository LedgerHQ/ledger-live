/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useReducer, useEffect, useCallback, useState, useContext } from "react";
import { DrawerProps as SideDrawerProps } from "~/renderer/components/SideDrawer";

type ExtractProps<TComponent> = TComponent extends React.ComponentType<infer TProps>
  ? TProps
  : undefined;

export type State<
  C extends React.ComponentType<any> | undefined = React.ComponentType<any> | undefined,
> = {
  Component: C;
  props: ExtractProps<C> & {
    onRequestBack?: (a: React.MouseEvent<Element, MouseEvent> | KeyboardEvent) => void;
  };
  open: boolean;
  options: Omit<SideDrawerProps, "children" | "isOpen" | "onRequestBack">;
}; // actions

// it makes them available and current from connector events handlers
export let setDrawer: <C extends React.ComponentType<any> | undefined = undefined>(
  Component?: C,
  props?: State<C>["props"],
  options?: State<C>["options"],
) => void = () => {};

// reducer
const reducer = (state: State, update: Partial<State>) => {
  return {
    ...state,
    ...update,
  };
};
const initialState: State = {
  Component: undefined,
  props: null,
  open: false,
  options: {},
};
export type ContextValue = {
  state: State;
  setDrawer: typeof setDrawer;
};
export const context: React.Context<ContextValue> = React.createContext<ContextValue>({
  state: initialState,
  setDrawer: () => {},
});

type AnalyticsContextValue = {
  analyticsDrawerName?: string;
  setAnalyticsDrawerName: (name?: string) => void;
};
export const analyticsDrawerContext = React.createContext<AnalyticsContextValue>({
  analyticsDrawerName: undefined,
  setAnalyticsDrawerName: () => {},
});

const DrawerProvider = ({ children }: { children: React.ReactNode }) => {
  const { setAnalyticsDrawerName } = useContext(analyticsDrawerContext);
  const [state, dispatch] = useReducer(reducer, initialState);
  const _setDrawer: typeof setDrawer = useCallback(
    (Component, props, options = {}) => {
      setAnalyticsDrawerName(undefined);
      dispatch({
        Component,
        props,
        open: !!Component,
        options,
      });
    },
    [setAnalyticsDrawerName],
  );
  useEffect(() => {
    setDrawer = _setDrawer;
  }, [_setDrawer]);
  return (
    <context.Provider
      value={{
        state,
        setDrawer: _setDrawer,
      }}
    >
      {children}
    </context.Provider>
  );
};

const DrawerProviderWithAnalytics = ({ children }: { children: React.ReactNode }) => {
  const [analyticsDrawerName, setAnalyticsDrawerName] = useState<string>();
  return (
    <analyticsDrawerContext.Provider value={{ analyticsDrawerName, setAnalyticsDrawerName }}>
      <DrawerProvider>{children}</DrawerProvider>
    </analyticsDrawerContext.Provider>
  );
};

export default DrawerProviderWithAnalytics;
