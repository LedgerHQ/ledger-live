import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { GenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal/types";

export type GenericAwarenessModalSliceState = {
  contentCards: GenericAwarenessModalContentCard[];
};

const initialState: GenericAwarenessModalSliceState = {
  contentCards: [],
};

const genericAwarenessModalSlice = createSlice({
  name: "genericAwarenessModal",
  initialState,
  reducers: {
    setGenericAwarenessModalContentCards: (
      state,
      action: PayloadAction<GenericAwarenessModalContentCard[]>,
    ) => {
      state.contentCards = action.payload;
    },
  },
});

export const { setGenericAwarenessModalContentCards } = genericAwarenessModalSlice.actions;

export const selectGenericAwarenessModalContentCards = (state: {
  genericAwarenessModal: GenericAwarenessModalSliceState;
}) => state.genericAwarenessModal.contentCards;

export const selectGenericAwarenessModalContentCardByCampaignId = (
  state: { genericAwarenessModal: GenericAwarenessModalSliceState },
  campaignId: string | undefined,
): GenericAwarenessModalContentCard | undefined => {
  if (!campaignId) {
    return undefined;
  }
  return state.genericAwarenessModal.contentCards.find(card => card.id === campaignId);
};

export default genericAwarenessModalSlice.reducer;
