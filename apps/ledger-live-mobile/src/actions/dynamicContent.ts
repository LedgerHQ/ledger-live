import { createAction } from "redux-actions";
import {
  WalletContentCard,
  AssetContentCard,
  NotificationContentCard,
  CategoryContentCard,
  BrazeContentCard,
} from "../dynamicContent/types";
import {
  DynamicContentActionTypes,
  DynamicContentSetWalletCardsPayload,
  DynamicContentSetAssetCardsPayload,
  DynamicContentSetNotificationCardsPayload,
  DynamicContentSetCategoriesCardsPayload,
  DynamicContentSetMobileCardsPayload,
  DynamicContentSetLandingStickyCtaCardsPayload,
  DynamicContentAddLocalCardsPayload,
  DynamicContentRemoveLocalCardPayload,
} from "./types";

const setDynamicContentWalletCardsAction = createAction<DynamicContentSetWalletCardsPayload>(
  DynamicContentActionTypes.DYNAMIC_CONTENT_SET_WALLET_CARDS,
);

export const setDynamicContentWalletCards = (walletCards: WalletContentCard[]) =>
  setDynamicContentWalletCardsAction(walletCards);

const setDynamicContentAssetsCardsAction = createAction<DynamicContentSetAssetCardsPayload>(
  DynamicContentActionTypes.DYNAMIC_CONTENT_SET_ASSET_CARDS,
);

export const setDynamicContentAssetsCards = (assetsCards: AssetContentCard[]) =>
  setDynamicContentAssetsCardsAction(assetsCards);

const setDynamicContentCategoriesCardsAction =
  createAction<DynamicContentSetCategoriesCardsPayload>(
    DynamicContentActionTypes.DYNAMIC_CONTENT_SET_CATEGORIES_CARDS,
  );

export const setDynamicContentMobileCards = (mobileCards: BrazeContentCard[]) =>
  setDynamicContentMobileCardsAction(mobileCards);

const setDynamicContentMobileCardsAction = createAction<DynamicContentSetMobileCardsPayload>(
  DynamicContentActionTypes.DYNAMIC_CONTENT_SET_MOBILE_CARDS,
);

export const setDynamicContentCategoriesCards = (categoriesCards: CategoryContentCard[]) =>
  setDynamicContentCategoriesCardsAction(categoriesCards);

const setDynamicContentNotificationCardsAction =
  createAction<DynamicContentSetNotificationCardsPayload>(
    DynamicContentActionTypes.DYNAMIC_CONTENT_SET_NOTIFICATION_CARDS,
  );

export const setDynamicContentLandingPageStickyCtaCards =
  createAction<DynamicContentSetLandingStickyCtaCardsPayload>(
    DynamicContentActionTypes.DYNAMIC_CONTENT_SET_LANDING_STICKY_CTA_CARDS,
  );

export const setDynamicContentNotificationCards = (notificationCards: NotificationContentCard[]) =>
  setDynamicContentNotificationCardsAction(notificationCards);

const setIsDynamicContentLoadingAction = createAction<boolean>(
  DynamicContentActionTypes.DYNAMIC_CONTENT_IS_LOADING,
);

export const setIsDynamicContentLoading = (isLoading: boolean) =>
  setIsDynamicContentLoadingAction(isLoading);

const addLocalContentCardsAction = createAction<DynamicContentAddLocalCardsPayload>(
  DynamicContentActionTypes.DYNAMIC_CONTENT_ADD_LOCAL_CARDS,
);

export const addLocalContentCards = (payload: DynamicContentAddLocalCardsPayload) =>
  addLocalContentCardsAction(payload);

const clearLocalContentCardsAction = createAction(
  DynamicContentActionTypes.DYNAMIC_CONTENT_CLEAR_LOCAL_CARDS,
);

export const clearLocalContentCards = () => clearLocalContentCardsAction();

const removeLocalCardAction = createAction<DynamicContentRemoveLocalCardPayload>(
  DynamicContentActionTypes.DYNAMIC_CONTENT_REMOVE_LOCAL_CARD,
);

export const removeLocalCard = (cardId: string) => removeLocalCardAction(cardId);
