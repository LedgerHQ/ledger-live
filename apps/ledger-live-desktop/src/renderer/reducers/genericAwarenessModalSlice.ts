import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type GenericAwarenessModalSliceState = {
  /** Optional campaign id from `ledgerwallet://generic-awareness-modal?id=…` */
  campaignId: string | undefined;
};

const initialState: GenericAwarenessModalSliceState = {
  campaignId: undefined,
};

const genericAwarenessModalSlice = createSlice({
  name: "genericAwarenessModal",
  initialState,
  reducers: {
    setGenericAwarenessModalCampaignId: (state, action: PayloadAction<string | undefined>) => {
      state.campaignId = action.payload;
    },
  },
});

export const selectGenericAwarenessModalCampaignId = (state: {
  genericAwarenessModal: GenericAwarenessModalSliceState;
}) => state.genericAwarenessModal.campaignId;

export const { setGenericAwarenessModalCampaignId } = genericAwarenessModalSlice.actions;
export default genericAwarenessModalSlice.reducer;
