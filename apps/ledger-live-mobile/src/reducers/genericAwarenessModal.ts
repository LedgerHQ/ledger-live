import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { State } from "./types";

export type GenericAwarenessModalState = {
  isOpen: boolean;
  campaignId: string | undefined;
};

type OpenGenericAwarenessModalPayload = {
  campaignId?: string;
};

const initialState: GenericAwarenessModalState = {
  isOpen: false,
  campaignId: undefined,
};

const genericAwarenessModalSlice = createSlice({
  name: "genericAwarenessModal",
  initialState,
  reducers: {
    openGenericAwarenessModal: (state, action: PayloadAction<OpenGenericAwarenessModalPayload>) => {
      state.isOpen = true;
      state.campaignId = action.payload.campaignId;
    },
    closeGenericAwarenessModal: state => {
      state.isOpen = false;
      state.campaignId = undefined;
    },
  },
});

export const { openGenericAwarenessModal, closeGenericAwarenessModal } =
  genericAwarenessModalSlice.actions;

export const genericAwarenessModalSelector = (state: State) => state.genericAwarenessModal;

export default genericAwarenessModalSlice.reducer;
