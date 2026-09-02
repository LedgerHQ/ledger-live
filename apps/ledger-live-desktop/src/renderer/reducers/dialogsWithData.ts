import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SwapTransactionStatusParams } from "@ledgerhq/live-common/exchange/swapTransactionStatus/index";
import type { Reducer } from "redux";
import type { State } from "~/renderer/reducers";

export const DIALOGS_WITH_DATA_IDS = ["SWAP_TRANSACTION_STATUS"] as const;
export type DialogWithDataId = (typeof DIALOGS_WITH_DATA_IDS)[number];

export type DialogWithDataPayloadById = {
  SWAP_TRANSACTION_STATUS: SwapTransactionStatusParams;
};

type DialogWithDataEntry<Id extends DialogWithDataId> = {
  isOpen: boolean;
  data: DialogWithDataPayloadById[Id] | null;
};

export type DialogsWithDataState = {
  [Id in DialogWithDataId]: DialogWithDataEntry<Id>;
};

export type DialogWithDataOpenPayload = {
  [Id in DialogWithDataId]: {
    id: Id;
    data: DialogWithDataPayloadById[Id];
  };
}[DialogWithDataId];

const initialState: DialogsWithDataState = {
  SWAP_TRANSACTION_STATUS: {
    isOpen: false,
    data: null,
  },
};

const dialogsWithDataSlice = createSlice({
  name: "dialogsWithData",
  initialState,
  reducers: {
    openDialogWithData: (state, action: PayloadAction<DialogWithDataOpenPayload>) => {
      state[action.payload.id] = {
        isOpen: true,
        data: action.payload.data,
      };
    },
    closeDialogWithData: (state, action: PayloadAction<DialogWithDataId>) => {
      state[action.payload].isOpen = false;
      state[action.payload].data = null;
    },
  },
});

export const { openDialogWithData, closeDialogWithData } = dialogsWithDataSlice.actions;

export const selectIsDialogWithDataOpen = (
  state: Pick<State, "dialogsWithData">,
  id: DialogWithDataId,
) => state.dialogsWithData[id].isOpen;

export const selectDialogWithDataParams = <Id extends DialogWithDataId>(
  state: Pick<State, "dialogsWithData">,
  id: Id,
) => state.dialogsWithData[id].data;

const dialogsWithDataReducer: Reducer<DialogsWithDataState> = dialogsWithDataSlice.reducer;

export default dialogsWithDataReducer;
