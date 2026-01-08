import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { State } from "~/renderer/reducers";
import { ModalData } from "~/renderer/modals/types";

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

const initialState: ModalsState = {};

export type OpenPayload<Name extends keyof ModalData = keyof ModalData> = {
  name: Name;
  data?: ModalData[Name];
};

export type OpenModal = <Name extends keyof ModalData>(
  name: Name,
  data: ModalData[Name],
) => { name: Name; data: ModalData[Name] };

const modalsSlice = createSlice({
  name: "modals",
  initialState,
  reducers: {
    openModal: {
      reducer: (state, action: PayloadAction<OpenPayload>) => {
        const { name, data } = action.payload;
        return {
          ...state,
          [name]: {
            isOpened: true,
            data,
          },
        };
      },
      prepare: <Name extends keyof ModalData>(name: Name, data: ModalData[Name]) => ({
        payload: { name, data },
      }),
    },
    closeModal: {
      reducer: (state, action: PayloadAction<{ name: keyof ModalData }>) => {
        const { name } = action.payload;
        return {
          ...state,
          [name]: {
            isOpened: false,
          },
        };
      },
      prepare: (name: keyof ModalData) => ({
        payload: { name },
      }),
    },
    closeAllModal: () => {
      return {};
    },
    setDataModal: {
      reducer: (state, action: PayloadAction<OpenPayload>) => {
        const { name, data } = action.payload;
        return {
          ...state,
          [name]: {
            ...state[name],
            data,
          },
        };
      },
      prepare: <Name extends keyof ModalData>(name: Name, data: ModalData[Name]) => ({
        payload: { name, data },
      }),
    },
  },
});

export const { openModal, closeModal, closeAllModal, setDataModal } = modalsSlice.actions;

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

export default modalsSlice.reducer;
