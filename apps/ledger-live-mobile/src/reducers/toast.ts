import { handleActions } from "redux-actions";
import type { ReducerMap, Action } from "redux-actions";
import { State } from "./types";
import type { ToastData } from "@ledgerhq/live-common/notifications/ToastProvider/types";
import { shallowEqual } from "react-redux";
import { useSelector } from "~/context/store";

export type ToastState = { toasts: ToastData[] };

export const INITIAL_STATE: ToastState = {
  toasts: [],
};

export type Payload = ToastData | string;

const handlers: ReducerMap<ToastState, Payload> = {
  ["pushToast"]: (state, action) => {
    return {
      ...state,
      toasts: [...state.toasts, (action as Action<ToastData>).payload],
    };
  },

  ["dismissToast"]: (state, action) => ({
    ...state,
    toasts: state.toasts.filter(toast => toast.id !== (action as Action<string>).payload),
  }),
};

export const useToasts = () => useSelector((state: State) => state.toasts.toasts, shallowEqual);

export default handleActions<ToastState, Payload>(handlers, INITIAL_STATE);
