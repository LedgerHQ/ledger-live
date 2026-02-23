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
  DynamicContentRemoveLocalCardPayload,
} from "../actions/types";
import { createSelector } from "~/context/selectors";

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
    return {
      ...state,
      localCategoriesCards: [...state.localCategoriesCards, category],
      localMobileCards: [...state.localMobileCards, ...cards],
    };
  },
  [DynamicContentActionTypes.DYNAMIC_CONTENT_CLEAR_LOCAL_CARDS]: state => ({
    ...state,
    localCategoriesCards: [],
    localMobileCards: [],
  }),
  [DynamicContentActionTypes.DYNAMIC_CONTENT_REMOVE_LOCAL_CARD]: (state, action) => {
    const cardId = (action as Action<DynamicContentRemoveLocalCardPayload>).payload;
    const localMobileCards = state.localMobileCards.filter(c => c.id !== cardId);
    const categoryIdsWithCards = new Set(
      localMobileCards.map(c => (c.extras as { categoryId?: string })?.categoryId).filter(Boolean),
    );
    const localCategoriesCards = state.localCategoriesCards.filter(cat =>
      categoryIdsWithCards.has(cat.categoryId),
    );
    return {
      ...state,
      localMobileCards,
      localCategoriesCards,
    };
  },
};

// Selectors
export const assetsCardsSelector = (s: State) => s.dynamicContent.assetsCards;

export const walletCardsSelector = (s: State) => s.dynamicContent.walletCards;

export const notificationsCardsSelector = (s: State) => s.dynamicContent.notificationCards;

export const categoriesCardsSelector = createSelector(
  (s: State) => s.dynamicContent.categoriesCards,
  (s: State) => s.dynamicContent.localCategoriesCards,
  (categoriesCards, localCategoriesCards) => categoriesCards.concat(localCategoriesCards),
);

export const landingPageStickyCtaCardsSelector = (s: State) =>
  s.dynamicContent.landingPageStickyCtaCards;

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
