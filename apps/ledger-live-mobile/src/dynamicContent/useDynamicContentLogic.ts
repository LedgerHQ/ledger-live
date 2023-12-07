import { useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  setDynamicContentWalletCards,
  setDynamicContentAssetsCards,
  setDynamicContentNotificationCards,
  setDynamicContentLearnCards,
  setDynamicContentCategoriesCards,
  setDynamicContentMobileCards,
} from "../actions/dynamicContent";
import { useBrazeContentCard } from "./brazeContentCard";
import {
  filterByPage,
  filterByType,
  mapAsWalletContentCard,
  mapAsAssetContentCard,
  mapAsNotificationContentCard,
  mapAsLearnContentCard,
  mapAsCategoryContentCard,
  getMobileContentCards,
  compareCards,
} from "./dynamicContent";
import { LocationContentCard, ContentCardsType } from "./types";

export const useDynamicContentLogic = () => {
  const dispatch = useDispatch();
  const { Braze, refreshDynamicContent } = useBrazeContentCard();

  const fetchData = useCallback(async () => {
    // Fetch data from Braze
    const contentCards = await Braze.getContentCards();
    const mobileContentCards = getMobileContentCards(contentCards);
    // Filtering v0
    const walletCards = filterByPage(mobileContentCards, LocationContentCard.Wallet)
      .map(card => mapAsWalletContentCard(card))
      .sort(compareCards);

    const assetCards = filterByPage(mobileContentCards, LocationContentCard.Asset)
      .map(card => mapAsAssetContentCard(card))
      .sort(compareCards);

    const notificationCards = filterByPage(
      mobileContentCards,
      LocationContentCard.NotificationCenter,
    )
      .map(card => mapAsNotificationContentCard(card))
      .sort(compareCards);

    const learnCards = filterByPage(mobileContentCards, LocationContentCard.Learn)
      .map(card => mapAsLearnContentCard(card))
      .sort(compareCards);

    const categoriesCards = filterByType(mobileContentCards, ContentCardsType.category)
      .map(card => mapAsCategoryContentCard(card))
      .sort(compareCards);

    dispatch(setDynamicContentCategoriesCards(categoriesCards));
    dispatch(setDynamicContentMobileCards(mobileContentCards));
    dispatch(setDynamicContentWalletCards(walletCards));
    dispatch(setDynamicContentAssetsCards(assetCards));
    dispatch(setDynamicContentNotificationCards(notificationCards));
    dispatch(setDynamicContentLearnCards(learnCards));
  }, [Braze, dispatch]);

  return {
    refreshDynamicContent,
    fetchData,
  };
};
