import Braze from "@braze/react-native-sdk";
import { useCallback } from "react";
import { useSelector, useDispatch } from "~/context/store";
import {
  setDynamicContentWalletCards,
  setDynamicContentAssetsCards,
  setDynamicContentNotificationCards,
  setDynamicContentCategoriesCards,
  setDynamicContentMobileCards,
  setIsDynamicContentLoading,
  setDynamicContentLandingPageStickyCtaCards,
} from "../actions/dynamicContent";
import {
  filterByPage,
  filterByType,
  filterCardsThatHaveBeenDismissed,
  mapAsWalletContentCard,
  mapAsAssetContentCard,
  mapAsNotificationContentCard,
  mapAsCategoryContentCard,
  mapAsLandingPageStickyCtaContentCard,
  getMobileContentCards,
  compareCards,
} from "./utils";
import { ContentCardLocation, ContentCardsType, BrazeContentCard } from "./types";
import { dismissedContentCardsSelector } from "~/reducers/settings";
import { getOldCampaignIds } from "@ledgerhq/live-common/braze/anonymousUsers";
import { clearDismissedContentCards } from "~/actions/settings";

export const useDynamicContentLogic = () => {
  const dispatch = useDispatch();
  const refreshDynamicContent = useCallback(() => Braze.requestContentCardsRefresh(), []);
  const dismissedContentCards = useSelector(dismissedContentCardsSelector) || {};
  const dismissedContentCardsIds = Object.keys(dismissedContentCards);

  const fetchData = useCallback(async () => {
    dispatch(setIsDynamicContentLoading(true));

    // Fetch data from Braze
    let contentCards: BrazeContentCard[] = [];
    try {
      contentCards = await Braze.getContentCards();
    } catch (error) {
      console.error("Error fetching dynamic content", error);
    }

    const filteredContentCards = filterCardsThatHaveBeenDismissed(
      contentCards,
      dismissedContentCardsIds,
    );
    const mobileContentCards = getMobileContentCards(filteredContentCards);
    // Filtering v0
    const walletCards = filterByPage(mobileContentCards, ContentCardLocation.Wallet)
      .map(card => mapAsWalletContentCard(card))
      .sort(compareCards);

    const assetCards = filterByPage(mobileContentCards, ContentCardLocation.Asset)
      .map(card => mapAsAssetContentCard(card))
      .sort(compareCards);

    const notificationCards = filterByPage(
      mobileContentCards,
      ContentCardLocation.NotificationCenter,
    )
      .map(card => mapAsNotificationContentCard(card))
      .sort(compareCards);

    const categoriesCards = filterByType(mobileContentCards, ContentCardsType.category)
      .map(card => mapAsCategoryContentCard(card))
      .sort(compareCards);

    const landingPageStickyCtaCards = filterByPage(
      mobileContentCards,
      ContentCardLocation.LandingPageStickyCta,
    )
      .map(card => mapAsLandingPageStickyCtaContentCard(card))
      .sort(compareCards);

    dispatch(setDynamicContentCategoriesCards(categoriesCards));
    dispatch(setDynamicContentMobileCards(mobileContentCards));
    dispatch(setDynamicContentWalletCards(walletCards));
    dispatch(setDynamicContentAssetsCards(assetCards));
    dispatch(setDynamicContentNotificationCards(notificationCards));
    dispatch(setDynamicContentLandingPageStickyCtaCards(landingPageStickyCtaCards));
    dispatch(setIsDynamicContentLoading(false));
  }, [dismissedContentCardsIds, dispatch]);

  const clearOldDismissedContentCards = () => {
    const oldCampaignIds = getOldCampaignIds(dismissedContentCards || {});
    if (oldCampaignIds.length > 0) {
      dispatch(clearDismissedContentCards(oldCampaignIds));
    }
  };

  return {
    refreshDynamicContent,
    fetchData,
    clearOldDismissedContentCards,
  };
};
