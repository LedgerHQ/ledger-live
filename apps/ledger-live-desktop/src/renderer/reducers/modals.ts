import { handleActions } from "redux-actions";
import { State } from "~/renderer/reducers";
import { ModalData } from "~/renderer/modals/types";
import { Handlers } from "./types";

export type ModalsState = {
  [Name in keyof ModalData]?:
    | {
        isOpened: true;
        data: ModalData[Name];
      }
    | {
        isOpened: false;
      };
};

const state: ModalsState = {};

export type OpenPayload<Name extends keyof ModalData = keyof ModalData> = {
  name: Name;
  data?: ModalData[Name];
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
  MODAL_SET_DATA: <Name extends keyof ModalData>(
    state: ModalsState,
    { payload }: { payload: OpenPayload<Name> },
  ) => {
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

export const isModalOpened = <Name extends keyof ModalData>(state: State, name: Name): boolean =>
  state.modals[name]?.isOpened || false;

export const getModalData = <Name extends keyof ModalData>(
  state: State,
  name: Name,
): ModalData[Name] | undefined => {
  const modal = state.modals[name];
  if (modal?.isOpened) {
    return modal?.data;
  }
};

// Exporting reducer

export default handleActions<ModalsState, HandlersPayloads[keyof HandlersPayloads]>(
  (handlers as unknown) as ModalsHandlers<false>,
  state,
);
