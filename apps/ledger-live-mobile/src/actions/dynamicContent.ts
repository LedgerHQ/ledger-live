import { createAction } from "redux-actions";
import {
  WalletContentCard,
  AssetContentCard,
  LearnContentCard,
  NotificationContentCard,
  CategoryContentCard,
  BrazeContentCard,
} from "../dynamicContent/types";
import {
  DynamicContentActionTypes,
  DynamicContentSetWalletCardsPayload,
  DynamicContentSetAssetCardsPayload,
  DynamicContentSetLearnCardsPayload,
  DynamicContentSetNotificationCardsPayload,
  DynamicContentSetCategoriesCardsPayload,
  DynamicContentSetMobileCardsPayload,
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

const setDynamicContentLearnCardsAction = createAction<DynamicContentSetLearnCardsPayload>(
  DynamicContentActionTypes.DYNAMIC_CONTENT_SET_LEARN_CARDS,
);

export const setDynamicContentLearnCards = (learnCards: LearnContentCard[]) =>
  setDynamicContentLearnCardsAction(learnCards);

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

export const setDynamicContentNotificationCards = (notificationCards: NotificationContentCard[]) =>
  setDynamicContentNotificationCardsAction(notificationCards);
