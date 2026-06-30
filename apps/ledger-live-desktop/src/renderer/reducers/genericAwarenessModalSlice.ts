import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { getGenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal";
import type { GenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal";
import { isAppStartContentCardId } from "LLD/features/GenericAwarenessModal/utils/isAppStartContentCardId";
import type { State } from "./index";
import { dismissedContentCardsSelector } from "./settings";

export type GenericAwarenessModalContentCardIdStatus = {
  id: string;
  inStore: boolean;
  dismissed: boolean;
};

/** UTF-16 code-unit compare — locale-independent ordering for campaign ids. */
export const compareCampaignIds = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

/** Dismissed campaign ids that belong to GAM (in store or APP_START). */
export const getGamDismissedCampaignIds = (
  contentCards: readonly GenericAwarenessModalContentCard[],
  dismissedContentCards: Readonly<Record<string, number>> | undefined,
): string[] => {
  const dismissed = dismissedContentCards ?? {};
  const storeIdSet = new Set(contentCards.map(card => card.id));
  return Object.keys(dismissed)
    .filter(id => storeIdSet.has(id) || isAppStartContentCardId(id))
    .sort(compareCampaignIds);
};

/** Union of stored GAM campaign ids and dismissed APP_START / in-store campaigns. */
export const buildGenericAwarenessModalContentCardIdStatuses = (
  contentCards: readonly GenericAwarenessModalContentCard[],
  dismissedContentCards: Readonly<Record<string, number>> | undefined,
): GenericAwarenessModalContentCardIdStatus[] => {
  const dismissed = dismissedContentCards ?? {};
  const storeIdSet = new Set(contentCards.map(card => card.id));
  const allIds = new Set([...storeIdSet, ...getGamDismissedCampaignIds(contentCards, dismissed)]);

  return [...allIds].sort(compareCampaignIds).map(id => ({
    id,
    inStore: storeIdSet.has(id),
    dismissed: Object.hasOwn(dismissed, id),
  }));
};

export type GenericAwarenessModalSliceState = {
  contentCards: GenericAwarenessModalContentCard[];
  /** Active campaign from deeplink (`?id=`) or open thunk; cleared on close */
  campaignId: string | undefined;
};

/**
 * Excludes campaigns the user has already seen (dismissed), matched by content card `id`.
 */
export const filterDismissedGenericAwarenessModalContentCards = (
  contentCards: readonly GenericAwarenessModalContentCard[],
  dismissedIds: readonly string[],
): GenericAwarenessModalContentCard[] => {
  if (dismissedIds.length === 0) {
    return [...contentCards];
  }
  const dismissed = new Set(dismissedIds);
  return contentCards.filter(card => !dismissed.has(card.id));
};

export const genericAwarenessModalInitialState: GenericAwarenessModalSliceState = {
  contentCards: [],
  campaignId: undefined,
};

const initialState = genericAwarenessModalInitialState;

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
    setGenericAwarenessModalCampaignId: (state, action: PayloadAction<string | undefined>) => {
      state.campaignId = action.payload;
    },
  },
});

export const { setGenericAwarenessModalContentCards, setGenericAwarenessModalCampaignId } =
  genericAwarenessModalSlice.actions;

// --- Base selectors (slice state only) ---

const selectGenericAwarenessModalState = (state: State): GenericAwarenessModalSliceState =>
  state.genericAwarenessModal ?? genericAwarenessModalInitialState;

export const selectGenericAwarenessModalCampaignId = (state: State): string | undefined =>
  selectGenericAwarenessModalState(state).campaignId;

const selectGenericAwarenessModalStoredContentCards = (state: State) =>
  selectGenericAwarenessModalState(state).contentCards;

export const selectGenericAwarenessModalHasStoredContentCards = (state: State): boolean =>
  selectGenericAwarenessModalStoredContentCards(state).length > 0;

// --- Cross-slice selectors ---

const selectDismissedGenericAwarenessModalIds = createSelector(
  dismissedContentCardsSelector,
  dismissed => Object.keys(dismissed ?? {}),
);

// --- Derived selectors (dismissed + resolved content cards) ---

export const selectGenericAwarenessModalContentCards = createSelector(
  selectGenericAwarenessModalStoredContentCards,
  selectDismissedGenericAwarenessModalIds,
  (contentCards, dismissedIds) =>
    filterDismissedGenericAwarenessModalContentCards(contentCards, dismissedIds),
);

export const selectGenericAwarenessModalAppStartContentCard = createSelector(
  selectGenericAwarenessModalContentCards,
  contentCards => getGenericAwarenessModalContentCard(contentCards),
);

export const selectGenericAwarenessModalContentCardByCampaignId = createSelector(
  selectGenericAwarenessModalContentCards,
  contentCards => (campaignId: string | undefined) =>
    getGenericAwarenessModalContentCard(contentCards, campaignId),
);

export const selectGenericAwarenessModalContentCardIdStatuses = createSelector(
  selectGenericAwarenessModalStoredContentCards,
  dismissedContentCardsSelector,
  buildGenericAwarenessModalContentCardIdStatuses,
);

export const selectGamDismissedCampaignIds = createSelector(
  selectGenericAwarenessModalStoredContentCards,
  dismissedContentCardsSelector,
  getGamDismissedCampaignIds,
);

export default genericAwarenessModalSlice.reducer;
