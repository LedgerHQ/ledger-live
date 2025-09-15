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
} from "../actions/types";

export const INITIAL_STATE: DynamicContentState = {
  assetsCards: [],
  walletCards: [],
  notificationCards: [],
  landingPageStickyCtaCards: [],
  categoriesCards: [],
  mobileCards: [],
  isLoading: true,
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
};

// Selectors
export const assetsCardsSelector = (s: State) => s.dynamicContent.assetsCards;

export const walletCardsSelector = (s: State) => s.dynamicContent.walletCards;

export const notificationsCardsSelector = (s: State) => s.dynamicContent.notificationCards;

export const categoriesCardsSelector = (s: State) => s.dynamicContent.categoriesCards;

export const landingPageStickyCtaCardsSelector = (s: State) =>
  s.dynamicContent.landingPageStickyCtaCards;

export const mobileCardsSelector = (s: State) => s.dynamicContent.mobileCards;

export const isDynamicContentLoadingSelector: (s: State) => boolean = (s: State) =>
  s.dynamicContent.isLoading;

export default handleActions<DynamicContentState, DynamicContentPayload>(handlers, INITIAL_STATE);
