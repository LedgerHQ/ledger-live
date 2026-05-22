import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getGenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal/getGenericAwarenessModalContentCard";
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
  selectors: {
    selectGenericAwarenessModalContentCards: state => state.contentCards,
    selectGenericAwarenessModalContentCardByCampaignId:
      state => (campaignId: string | undefined) => {
        return getGenericAwarenessModalContentCard(state.contentCards, campaignId);
      },
  },
});

export const { setGenericAwarenessModalContentCards } = genericAwarenessModalSlice.actions;

export const {
  selectGenericAwarenessModalContentCardByCampaignId,
  selectGenericAwarenessModalContentCards,
} = genericAwarenessModalSlice.selectors;

export default genericAwarenessModalSlice.reducer;
