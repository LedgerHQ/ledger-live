import React, { useReducer, useEffect, useCallback, useState, useContext } from "react";
import { DrawerProps as SideDrawerProps } from "~/renderer/components/SideDrawer";

export type State<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  C extends React.ComponentType<P> | undefined | null = React.ComponentType<any> | undefined | null,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  P = any
> = {
  Component: C;
  props?: P;
  open: boolean;
  options: Omit<SideDrawerProps, "children" | "isOpen" | "onRequestBack">;
}; // actions

// it makes them available and current from connector events handlers
export let setDrawer: <
  P,
  C extends React.ComponentType<P> | undefined | null = P extends null
    ? null
    : React.ComponentType<P>
>(
  Component?: C,
  props?: State<C, P>["props"],
  options?: State<C, P>["options"],
) => void = () => null;

// reducer
const reducer = (state: State, update: Partial<State>) => {
  return {
    ...state,
    ...update,
  };
};
const initialState: State = {
  Component: null,
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
  setDrawer: () => null,
});

type AnalyticsContextValue = {
  analyticsDrawerName?: string;
  setAnalyticsDrawerName: (name?: string) => void;
};
export const analyticsDrawerContext = React.createContext<AnalyticsContextValue>({
  analyticsDrawerName: undefined,
  setAnalyticsDrawerName: () => null,
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
