import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import type { DynamicContentState, State } from "./types";
import {
  DynamicContentActionTypes,
  DynamicContentPayload,
  DynamicContentSetWalletCardsPayload,
  DynamicContentSetAssetCardsPayload,
  DynamicContentSetNotificationCardsPayload,
  DynamicContentSetCategoriesCardsPayload,
  DynamicContentSetMobileCardsPayload,
  DynamicContentSetLandingStickyCtaCardsPayload,
  DynamicContentAddLocalCardsPayload,
  DynamicContentAppendLocalCardsPayload,
  DynamicContentRemoveLocalCardPayload,
  DynamicContentAddLocalWalletCarouselPayload,
  DynamicContentMarkLocalCardsViewedPayload,
} from "../actions/types";
import { createSelector } from "~/context/selectors";
import {
  compareCards,
  mapAsAssetContentCard,
  mapAsLandingPageStickyCtaContentCard,
  mapAsNotificationContentCard,
} from "~/dynamicContent/utils";
import { ContentCardLocation } from "~/dynamicContent/types";

export const INITIAL_STATE: DynamicContentState = {
  assetsCards: [],
  walletCards: [],
  notificationCards: [],
  landingPageStickyCtaCards: [],
  categoriesCards: [],
  mobileCards: [],
  isLoading: true,
  localCategoriesCards: [],
  localMobileCards: [],
  localWalletCards: [],
};

const handlers: ReducerMap<DynamicContentState, DynamicContentPayload> = {
  [DynamicContentActionTypes.DYNAMIC_CONTENT_SET_WALLET_CARDS]: (state, action) => ({
    ...state,
    walletCards: (action as Action<DynamicContentSetWalletCardsPayload>).payload,
  }),
  [DynamicContentActionTypes.DYNAMIC_CONTENT_SET_ASSET_CARDS]: (state, action) => ({
    ...state,
    assetsCards: (action as Action<DynamicContentSetAssetCardsPayload>).payload,
  }),
  [DynamicContentActionTypes.DYNAMIC_CONTENT_SET_NOTIFICATION_CARDS]: (state, action) => ({
    ...state,
    notificationCards: (action as Action<DynamicContentSetNotificationCardsPayload>).payload,
  }),
  [DynamicContentActionTypes.DYNAMIC_CONTENT_SET_CATEGORIES_CARDS]: (state, action) => ({
    ...state,
    categoriesCards: (action as Action<DynamicContentSetCategoriesCardsPayload>).payload,
  }),
  [DynamicContentActionTypes.DYNAMIC_CONTENT_SET_LANDING_STICKY_CTA_CARDS]: (state, action) => ({
    ...state,
    landingPageStickyCtaCards: (action as Action<DynamicContentSetLandingStickyCtaCardsPayload>)
      .payload,
  }),
  [DynamicContentActionTypes.DYNAMIC_CONTENT_SET_MOBILE_CARDS]: (state, action) => ({
    ...state,
    mobileCards: (action as Action<DynamicContentSetMobileCardsPayload>).payload,
  }),
  [DynamicContentActionTypes.DYNAMIC_CONTENT_IS_LOADING]: (state, action) => ({
    ...state,
    isLoading: (action as unknown as Action<boolean>).payload,
  }),
  [DynamicContentActionTypes.DYNAMIC_CONTENT_ADD_LOCAL_CARDS]: (state, action) => {
    const { category, cards } = (action as Action<DynamicContentAddLocalCardsPayload>).payload;
    const localCategoriesCardsWithoutSameId = category.categoryId
      ? state.localCategoriesCards.filter(existing => existing.categoryId !== category.categoryId)
      : state.localCategoriesCards;
    return {
      ...state,
      localCategoriesCards: [...localCategoriesCardsWithoutSameId, category],
      localMobileCards: [...state.localMobileCards, ...cards],
    };
  },
  [DynamicContentActionTypes.DYNAMIC_CONTENT_APPEND_LOCAL_CARDS]: (state, action) => {
    const cards = (action as Action<DynamicContentAppendLocalCardsPayload>).payload;
    return {
      ...state,
      localMobileCards: [...state.localMobileCards, ...cards],
    };
  },
  [DynamicContentActionTypes.DYNAMIC_CONTENT_CLEAR_LOCAL_CARDS]: state => ({
    ...state,
    localCategoriesCards: [],
    localMobileCards: [],
    localWalletCards: [],
  }),
  [DynamicContentActionTypes.DYNAMIC_CONTENT_ADD_LOCAL_WALLET_CAROUSEL_CARDS]: (state, action) => ({
    ...state,
    localWalletCards: [
      ...state.localWalletCards,
      ...(action as Action<DynamicContentAddLocalWalletCarouselPayload>).payload,
    ],
  }),
  [DynamicContentActionTypes.DYNAMIC_CONTENT_MARK_LOCAL_CARDS_VIEWED]: (state, action) => {
    const viewedIds = new Set(
      (action as Action<DynamicContentMarkLocalCardsViewedPayload>).payload,
    );
    return {
      ...state,
      localMobileCards: state.localMobileCards.map(card =>
        viewedIds.has(card.id) ? { ...card, viewed: true } : card,
      ),
    };
  },
  [DynamicContentActionTypes.DYNAMIC_CONTENT_REMOVE_LOCAL_CARD]: (state, action) => {
    const cardId = (action as Action<DynamicContentRemoveLocalCardPayload>).payload;
    const localMobileCards = state.localMobileCards.filter(c => c.id !== cardId);
    const localWalletCards = state.localWalletCards.filter(c => c.id !== cardId);
    const categoryIdsWithCards = new Set(
      localMobileCards.map(c => (c.extras as { categoryId?: string })?.categoryId).filter(Boolean),
    );
    const localCategoriesCards = state.localCategoriesCards.filter(cat =>
      categoryIdsWithCards.has(cat.categoryId),
    );
    return {
      ...state,
      localMobileCards,
      localWalletCards,
      localCategoriesCards,
    };
  },
};

// Selectors
export const assetsCardsSelector = createSelector(
  (s: State) => s.dynamicContent.assetsCards,
  (s: State) => s.dynamicContent.localMobileCards,
  (assetsCards, localMobileCards) => {
    const localAssetCards = localMobileCards
      .filter(card => card.extras.location === ContentCardLocation.Asset)
      .map(card => mapAsAssetContentCard(card));

    if (localAssetCards.length === 0) return assetsCards;

    return assetsCards.concat(localAssetCards).sort(compareCards);
  },
);

export const walletCardsSelector = createSelector(
  (s: State) => s.dynamicContent.walletCards,
  (s: State) => s.dynamicContent.localWalletCards,
  (walletCards, localWalletCards) => walletCards.concat(localWalletCards),
);

export const localWalletCardsSelector = (s: State) => s.dynamicContent.localWalletCards;

export const notificationsCardsSelector = createSelector(
  (s: State) => s.dynamicContent.notificationCards,
  (s: State) => s.dynamicContent.localMobileCards,
  (notificationCards, localMobileCards) => {
    const localNotificationCards = localMobileCards
      .filter(card => card.extras.location === ContentCardLocation.NotificationCenter)
      .map(card => mapAsNotificationContentCard(card));

    if (localNotificationCards.length === 0) return notificationCards;

    return notificationCards.concat(localNotificationCards).sort(compareCards);
  },
);

export const categoriesCardsSelector = createSelector(
  (s: State) => s.dynamicContent.categoriesCards,
  (s: State) => s.dynamicContent.localCategoriesCards,
  (categoriesCards, localCategoriesCards) => categoriesCards.concat(localCategoriesCards),
);

export const landingPageStickyCtaCardsSelector = createSelector(
  (s: State) => s.dynamicContent.landingPageStickyCtaCards,
  (s: State) => s.dynamicContent.localMobileCards,
  (landingPageStickyCtaCards, localMobileCards) => {
    const localLandingPageStickyCtaCards = localMobileCards
      .filter(card => card.extras.location === ContentCardLocation.LandingPageStickyCta)
      .map(card => mapAsLandingPageStickyCtaContentCard(card));

    if (localLandingPageStickyCtaCards.length === 0) return landingPageStickyCtaCards;

    return landingPageStickyCtaCards
      .concat(localLandingPageStickyCtaCards)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
);

export const mobileCardsSelector = createSelector(
  (s: State) => s.dynamicContent.mobileCards,
  (s: State) => s.dynamicContent.localMobileCards,
  (mobileCards, localMobileCards) => mobileCards.concat(localMobileCards),
);

export const mobileCardsFromBrazeSelector = (s: State) => s.dynamicContent.mobileCards;

export const localMobileCardsSelector = (s: State) => s.dynamicContent.localMobileCards;

export const localCategoriesCardsSelector = (s: State) => s.dynamicContent.localCategoriesCards;

export const isDynamicContentLoadingSelector: (s: State) => boolean = (s: State) =>
  s.dynamicContent.isLoading;

export default handleActions<DynamicContentState, DynamicContentPayload>(handlers, INITIAL_STATE);
