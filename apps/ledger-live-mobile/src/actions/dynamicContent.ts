import { createAction } from "redux-actions";
import {
  WalletContentCard,
  AssetContentCard,
  LearnContentCard,
} from "../dynamicContent/types";
import {
  DynamicContentActionTypes,
  DynamicContentSetWalletCardsPayload,
  DynamicContentSetAssetCardsPayload,
  DynamicContentSetLearnCardsPayload,
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

const setDynamicContentLearnCardsAction =
  createAction<DynamicContentSetLearnCardsPayload>(
    DynamicContentActionTypes.DYNAMIC_CONTENT_SET_LEARN_CARDS,
  );

export const setDynamicContentLearnCards = (learnCards: LearnContentCard[]) =>
  setDynamicContentLearnCardsAction({
    learnCards,
  });
