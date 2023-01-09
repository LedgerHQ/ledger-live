import { createAction } from "redux-actions";
import {
  WalletContentCard,
  AssetContentCard,
  NotificationContentCard,
} from "../dynamicContent/types";
import {
  DynamicContentActionTypes,
  DynamicContentSetWalletCardsPayload,
  DynamicContentSetAssetCardsPayload,
  DynamicContentSetNotificationCardsPayload,
} from "./types";

const setDynamicContentWalletCardsAction =
  createAction<DynamicContentSetWalletCardsPayload>(
    DynamicContentActionTypes.DYNAMIC_CONTENT_SET_WALLET_CARDS,
  );

export const setDynamicContentWalletCards = (
  walletCards: WalletContentCard[],
) =>
  setDynamicContentWalletCardsAction({
    walletCards,
  });

const setDynamicContentAssetsCardsAction =
  createAction<DynamicContentSetAssetCardsPayload>(
    DynamicContentActionTypes.DYNAMIC_CONTENT_SET_ASSET_CARDS,
  );

export const setDynamicContentAssetsCards = (assetsCards: AssetContentCard[]) =>
  setDynamicContentAssetsCardsAction({
    assetsCards,
  });

const setDynamicContentNotificationCardsAction =
  createAction<DynamicContentSetNotificationCardsPayload>(
    DynamicContentActionTypes.DYNAMIC_CONTENT_SET_NOTIFICATION_CARDS,
  );

export const setDynamicContentNotificationCards = (
  notificationCards: NotificationContentCard[],
) =>
  setDynamicContentNotificationCardsAction({
    notificationCards,
  });
