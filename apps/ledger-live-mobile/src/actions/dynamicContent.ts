import { createAction } from "redux-actions";
import {
  WalletContentCard,
  AssetContentCard,
  DiscoverContentCard,
} from "../dynamicContent/types";
import {
  DynamicContentActionTypes,
  DynamicContentSetWalletCardsPayload,
  DynamicContentSetAssetCardsPayload,
  DynamicContentSetDiscoverCardsPayload,
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

const setDynamicContentDiscoverCardsAction =
  createAction<DynamicContentSetDiscoverCardsPayload>(
    DynamicContentActionTypes.DYNAMIC_CONTENT_SET_DISCOVER_CARDS,
  );

export const setDynamicContentDiscoverCards = (
  discoverCards: DiscoverContentCard[],
) =>
  setDynamicContentDiscoverCardsAction({
    discoverCards,
  });
