import React, { useReducer, useEffect, useCallback } from "react";
import { DrawerProps as SideDrawerProps } from "~/renderer/components/SideDrawer";
type State = {
  Component: React$ComponentType<any> | undefined | null;
  props?: null | any;
  open: boolean;
  options: Omit<SideDrawerProps, "children" | "isOpen" | "onRequestBack" | "onRequestClose">;
}; // actions
// it makes them available and current from connector events handlers
export let setDrawer: (
  Component?: State["Component"],
  props?: State["props"],
  options?: State["options"],
) => void = () => null;

// reducer
const reducer = (state: State, update) => {
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
