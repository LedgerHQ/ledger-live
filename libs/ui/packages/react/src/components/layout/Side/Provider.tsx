import React, { useReducer, useEffect, useCallback, useContext } from "react";
import type { SideProps } from ".";

interface State<P extends SideProps = SideProps> {
  Component: React.ComponentType<P> | null | undefined;
  props?: P;
  open: boolean;
}
// actions
// it makes them available and current from connector events handlers
export let setSide: <P extends SideProps = SideProps>(
  Component?: State<P>["Component"],
  props?: State<P>["props"],
) => void = () => {};

// reducer
const reducer = <P extends SideProps = SideProps>(state: State<P>, update: State<P>) => {
  return { ...state, ...update };
};

const initialState: State = {
  Component: null,
  open: false,
};

interface ContextValue<P extends SideProps = SideProps> {
  state: State<P>;
  setSide: (Component?: React.ComponentType<P>, props?: P) => void;
}

export const context = React.createContext<ContextValue>({
  state: initialState,
  setSide: () => {},
});

export const useSide = (): ContextValue => {
  return useContext(context);
};

const SideProvider = ({ children }: { children: React.ReactNode }): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const _setSide = useCallback((Component, props) => {
    dispatch({
      Component,
      props,
      open: !!Component,
    });
  }, []);

  useEffect(() => {
    setSide = _setSide;
  }, [_setSide]);

  return (
    <context.Provider
      value={{
        state,
        setSide: _setSide,
      }}
    >
      {children}
    </context.Provider>
  );
};

export default SideProvider;
