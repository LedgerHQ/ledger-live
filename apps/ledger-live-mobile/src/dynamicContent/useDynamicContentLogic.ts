import { useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  setDynamicContentWalletCards,
  setDynamicContentAssetsCards,
  setDynamicContentNotificationCards,
  setDynamicContentLearnCards,
} from "../actions/dynamicContent";
import { useBrazeContentCard } from "./brazeContentCard";
import {
  filterByPage,
  mapAsWalletContentCard,
  mapAsAssetContentCard,
  mapAsNotificationContentCard,
  mapAsLearnContentCard,
} from "./dynamicContent";
import { LocationContentCard } from "./types";

export const useDynamicContentLogic = () => {
  const dispatch = useDispatch();
  const { Braze, refreshDynamicContent } = useBrazeContentCard();

  const fetchData = useCallback(async () => {
    // Fetch data from Braze
    const contentCards = await Braze.getContentCards();

    // Filtering v0
    const walletCards = filterByPage(
      contentCards,
      LocationContentCard.Wallet,
    ).map(card => mapAsWalletContentCard(card));

    const assetCards = filterByPage(
      contentCards,
      LocationContentCard.Asset,
    ).map(card => mapAsAssetContentCard(card));

    const notificationCards = filterByPage(
      contentCards,
      LocationContentCard.NotificationCenter,
    ).map(card => mapAsNotificationContentCard(card));

    const learnCards = filterByPage(
      contentCards,
      LocationContentCard.Learn,
    ).map(card => mapAsLearnContentCard(card));

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
