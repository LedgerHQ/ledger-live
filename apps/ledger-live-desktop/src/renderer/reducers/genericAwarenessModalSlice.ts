import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import {
  getGenericAwarenessModalContentCard,
  type GenericAwarenessModalContentCard,
} from "@ledgerhq/live-common/genericAwarenessModal";

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
    selectGenericAwarenessModalAppStartContentCard: state =>
      getGenericAwarenessModalContentCard(state.contentCards),
    selectGenericAwarenessModalContentCardByCampaignId:
      state => (campaignId: string | undefined) => {
        return getGenericAwarenessModalContentCard(state.contentCards, campaignId);
      },
  },
});

export const { setGenericAwarenessModalContentCards } = genericAwarenessModalSlice.actions;

export const {
  selectGenericAwarenessModalAppStartContentCard,
  selectGenericAwarenessModalContentCardByCampaignId,
  selectGenericAwarenessModalContentCards,
} = genericAwarenessModalSlice.selectors;

export default genericAwarenessModalSlice.reducer;
