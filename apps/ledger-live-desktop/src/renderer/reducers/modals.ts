import { handleActions } from "redux-actions";
import { State } from "~/renderer/reducers";
import { Handlers } from "./types";
export type ModalsState = {
  [key: string]: {
    isOpened: boolean;
    data?: unknown;
  };
};
const state: ModalsState = {};

type OpenPayload = {
  name: string;
  data?: unknown | undefined;
};
type HandlersPayloads = {
  MODAL_OPEN: OpenPayload;
  MODAL_CLOSE: {
    name: string;
  };
  MODAL_CLOSE_ALL: never;
  MODAL_SET_DATA: OpenPayload;
};
type ModalsHandlers<PreciseKey = true> = Handlers<ModalsState, HandlersPayloads, PreciseKey>;

const handlers: ModalsHandlers = {
  MODAL_OPEN: (state, { payload }) => {
    const { name, data } = payload;
    return {
      ...state,
      [name]: {
        isOpened: true,
        data,
      },
    };
  },
  MODAL_CLOSE: (state, { payload }) => {
    const { name } = payload;
    return {
      ...state,
      [name]: {
        isOpened: false,
      },
    };
  },
  MODAL_CLOSE_ALL: () => {
    return {};
  },
  MODAL_SET_DATA: (state, { payload }) => {
    const { name, data } = payload;
    return {
      ...state,
      [name]: {
        ...state[name],
        data,
      },
    };
  },
};

// Selectors

export const modalsStateSelector = (state: State): ModalsState => state.modals;
export const isModalOpened = (state: State, name: string) =>
  state.modals[name] && state.modals[name].isOpened;
export const getModalData = (state: State, name: string) =>
  state.modals[name] && state.modals[name].data;

// Exporting reducer

export default handleActions<ModalsState, HandlersPayloads[keyof HandlersPayloads]>(
  (handlers as unknown) as ModalsHandlers<false>,
  state,
);
