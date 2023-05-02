import React, { useReducer, useEffect, useCallback } from "react";
import { DrawerProps as SideDrawerProps } from "~/renderer/components/SideDrawer";
export type State<
  C extends React.ComponentType<P> | undefined | null = React.ComponentType<any> | undefined | null,
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
const DrawerProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const _setDrawer: typeof setDrawer = useCallback(
    (Component, props, options = {}) =>
      dispatch({
        Component,
        props,
        open: !!Component,
        options,
      }),
    [],
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
export default DrawerProvider;
