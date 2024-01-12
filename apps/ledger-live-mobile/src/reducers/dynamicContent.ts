import { handleActions } from "redux-actions";
import type { Action, ReducerMap } from "redux-actions";
import type { DynamicContentState, State } from "./types";
import {
  DynamicContentActionTypes,
  DynamicContentPayload,
  DynamicContentSetWalletCardsPayload,
  DynamicContentSetAssetCardsPayload,
  DynamicContentSetLearnCardsPayload,
  DynamicContentSetNotificationCardsPayload,
  DynamicContentSetCategoriesCardsPayload,
  DynamicContentSetMobileCardsPayload,
} from "../actions/types";

export const INITIAL_STATE: DynamicContentState = {
  assetsCards: [],
  walletCards: [],
  learnCards: [],
  notificationCards: [],
  categoriesCards: [],
  mobileCards: [],
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
  [DynamicContentActionTypes.DYNAMIC_CONTENT_SET_LEARN_CARDS]: (state, action) => ({
    ...state,
    learnCards: (action as Action<DynamicContentSetLearnCardsPayload>).payload,
  }),
  [DynamicContentActionTypes.DYNAMIC_CONTENT_SET_NOTIFICATION_CARDS]: (state, action) => ({
    ...state,
    notificationCards: (action as Action<DynamicContentSetNotificationCardsPayload>).payload,
  }),
  [DynamicContentActionTypes.DYNAMIC_CONTENT_SET_CATEGORIES_CARDS]: (state, action) => ({
    ...state,
    categoriesCards: (action as Action<DynamicContentSetCategoriesCardsPayload>).payload,
  }),
  [DynamicContentActionTypes.DYNAMIC_CONTENT_SET_MOBILE_CARDS]: (state, action) => ({
    ...state,
    mobileCards: (action as Action<DynamicContentSetMobileCardsPayload>).payload,
  }),
};

// Selectors
export const assetsCardsSelector = (s: State) => s.dynamicContent.assetsCards;

export const walletCardsSelector = (s: State) => s.dynamicContent.walletCards;

export const learnCardsSelector = (s: State) => s.dynamicContent.learnCards;

export const notificationsCardsSelector = (s: State) => s.dynamicContent.notificationCards;

export const categoriesCardsSelector = (s: State) => s.dynamicContent.categoriesCards;

export const mobileCardsSelector = (s: State) => s.dynamicContent.mobileCards;

export default handleActions<DynamicContentState, DynamicContentPayload>(handlers, INITIAL_STATE);
