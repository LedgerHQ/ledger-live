import { createAction } from "redux-actions";
import { WalletContentCard, AssetContentCard } from "../dynamicContent/types";
import {
  DynamicContentActionTypes,
  DynamicContentSetWalletCardsPayload,
  DynamicContentSetAssetCardsPayload,
  DynamicContentSetDismissCardPayload,
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

export const setDismissCard = (cardId: string) =>
  setDismissCardAction({
    dismissedCard: cardId,
  });

const setDismissCardAction = createAction<DynamicContentSetDismissCardPayload>(
  DynamicContentActionTypes.DYNAMIC_CONTENT_SET_DISMISS_CARD,
);
