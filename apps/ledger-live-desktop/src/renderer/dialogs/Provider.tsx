/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useReducer, useEffect, useCallback } from "react";
import { v4 as uuid } from "uuid";

type ExtractProps<TComponent> =
  TComponent extends React.ComponentType<infer TProps> ? TProps : undefined;

type DialogPropsOverride = {
  onOpenChange?: (open: boolean) => void;
} & Record<string, unknown>;

type DialogContentPropsOverride = Record<string, unknown>;

export type DialogOptions = {
  dialogProps?: DialogPropsOverride;
  contentProps?: DialogContentPropsOverride;
  onClose?: () => void;
};

export type DialogState<
  C extends React.ComponentType<any> | undefined = React.ComponentType<any> | undefined,
> = {
  Component: C;
  props: ExtractProps<C> | undefined;
  id: string;
  open: boolean;
  options: DialogOptions;
};

export type ContextValue = {
  state: DialogState;
  setDialog: typeof setDialog;
};

const initialState: DialogState = {
  Component: undefined,
  props: undefined,
  id: "",
  open: false,
  options: {},
};

export const context = React.createContext<ContextValue>({
  state: initialState,
  setDialog: () => {},
});

// actions
export let setDialog: <C extends React.ComponentType<any> | undefined = undefined>(
  Component?: C,
  props?: DialogState<C>["props"],
  options?: DialogOptions,
) => void = () => {};

const reducer = (state: DialogState, update: Partial<DialogState>) => ({
  ...state,
  ...update,
});

const DialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const _setDialog: typeof setDialog = useCallback(
    (Component, props, options = {}) => {
      const id = uuid();
      dispatch({
        Component,
        props,
        id,
        open: !!Component,
        options,
      });
    },
    [dispatch],
  );

  useEffect(() => {
    setDialog = _setDialog;
  }, [_setDialog]);

  return <context.Provider value={{ state, setDialog: _setDialog }}>{children}</context.Provider>;
};

export default DialogProvider;
