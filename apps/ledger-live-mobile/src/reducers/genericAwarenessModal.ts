import { type Action, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { type GenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal";
import {
  DynamicContentActionTypes,
  type DynamicContentSetBrazeCardsPayload,
} from "../actions/types";

export type GenericAwarenessModalMobileContentCard = GenericAwarenessModalContentCard & {
  isLocal?: boolean;
};

export type GenericAwarenessModalState = {
  isOpen: boolean;
  campaignId: string | undefined;
  contentCards: GenericAwarenessModalMobileContentCard[];
};

type OpenGenericAwarenessModalDrawerPayload = {
  campaignId?: string;
};

type MarkGenericAwarenessModalContentCardAsReadPayload = {
  id: string;
};

const isSetBrazeCards = (
  action: Action,
): action is PayloadAction<DynamicContentSetBrazeCardsPayload> =>
  action.type === DynamicContentActionTypes.DYNAMIC_CONTENT_SET_BRAZE_CARDS;

const initialState: GenericAwarenessModalState = {
  isOpen: false,
  campaignId: undefined,
  contentCards: [],
};

const genericAwarenessModalSlice = createSlice({
  name: "genericAwarenessModal",
  initialState,
  reducers: {
    openGenericAwarenessModalDrawer: (
      state,
      action: PayloadAction<OpenGenericAwarenessModalDrawerPayload>,
    ) => {
      state.isOpen = true;
      state.campaignId = action.payload.campaignId;
    },
    closeGenericAwarenessModalDrawer: state => {
      state.isOpen = false;
      state.campaignId = undefined;
    },
    setGenericAwarenessModalCampaignId: (state, action: PayloadAction<string>) => {
      state.campaignId = action.payload;
    },
    setGenericAwarenessModalContentCards: (
      state,
      action: PayloadAction<GenericAwarenessModalMobileContentCard[]>,
    ) => {
      state.contentCards = action.payload;
    },
    clearLocalGenericAwarenessModalContentCards: state => {
      state.contentCards = state.contentCards.filter(card => !card.isLocal);
    },
    appendGenericAwarenessModalContentCards: (
      state,
      action: PayloadAction<GenericAwarenessModalContentCard[]>,
    ) => {
      const brazeCardIds = new Set(action.payload.map(card => card.id));
      const existingCards = state.contentCards.filter(card => !brazeCardIds.has(card.id));

      state.contentCards = [...existingCards, ...action.payload];
    },
    replaceBrazeGenericAwarenessModalContentCards: (
      state,
      action: PayloadAction<GenericAwarenessModalContentCard[]>,
    ) => {
      const localCards = state.contentCards.filter(card => card.isLocal);
      state.contentCards = [...localCards, ...action.payload];
    },
    markGenericAwarenessModalContentCardAsRead: (
      state,
      action: PayloadAction<MarkGenericAwarenessModalContentCardAsReadPayload>,
    ) => {
      state.contentCards = state.contentCards.filter(card => card.id !== action.payload.id);
    },
  },
  extraReducers: builder => {
    builder.addMatcher(isSetBrazeCards, (state, action) => {
      const brazeCards = action.payload.genericAwarenessModalCards;
      if (!brazeCards) return;
      const localCards = state.contentCards.filter(card => card.isLocal);
      state.contentCards = [...localCards, ...brazeCards];
    });
  },
  selectors: {
    selectIsGenericAwarenessModalOpen: state => state.isOpen,
    selectGenericAwarenessModalCampaignId: state => state.campaignId,
    selectGenericAwarenessModalContentCards: state => state.contentCards,
    selectCurrentGenericAwarenessModalContentCard: state =>
      state.contentCards.find(card => card.id === state.campaignId),
  },
});

export const {
  openGenericAwarenessModalDrawer,
  closeGenericAwarenessModalDrawer,
  setGenericAwarenessModalCampaignId,
  setGenericAwarenessModalContentCards,
  clearLocalGenericAwarenessModalContentCards,
  appendGenericAwarenessModalContentCards,
  replaceBrazeGenericAwarenessModalContentCards,
  markGenericAwarenessModalContentCardAsRead,
} = genericAwarenessModalSlice.actions;

export const {
  selectIsGenericAwarenessModalOpen,
  selectGenericAwarenessModalCampaignId,
  selectGenericAwarenessModalContentCards,
  selectCurrentGenericAwarenessModalContentCard,
} = genericAwarenessModalSlice.selectors;

export default genericAwarenessModalSlice.reducer;
