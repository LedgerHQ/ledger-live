import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { State } from "~/renderer/reducers";

export type GenericAwarenessModalDialogState = {
  /** Active campaign from deeplink (`?id=`) or open thunk; cleared on close */
  campaignId: string | undefined;
};

const initialState: GenericAwarenessModalDialogState = {
  campaignId: undefined,
};

const genericAwarenessModalDialogSlice = createSlice({
  name: "genericAwarenessModalDialog",
  initialState,
  reducers: {
    setGenericAwarenessModalCampaignId: (
      state,
      action: PayloadAction<string | undefined>,
    ) => {
      state.campaignId = action.payload;
    },
  },
});

export const { setGenericAwarenessModalCampaignId } = genericAwarenessModalDialogSlice.actions;

export const selectGenericAwarenessModalCampaignId = (
  state: Pick<State, "genericAwarenessModalDialog">,
): string | undefined => state.genericAwarenessModalDialog.campaignId;

export default genericAwarenessModalDialogSlice.reducer;
