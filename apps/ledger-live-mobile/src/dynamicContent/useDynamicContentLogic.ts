import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setDynamicContentWalletCards,
  setDynamicContentAssetsCards,
  setDynamicContentNotificationCards,
  setDynamicContentLearnCards,
  setDynamicContentCategoriesCards,
  setDynamicContentMobileCards,
  setIsDynamicContentLoading,
  setDynamicContentLandingPageStickyCtaCards,
} from "../actions/dynamicContent";
import { useBrazeContentCard } from "./brazeContentCard";
import {
  filterByPage,
  filterByType,
  filterCardsThatHaveBeenDismissed,
  mapAsWalletContentCard,
  mapAsAssetContentCard,
  mapAsNotificationContentCard,
  mapAsLearnContentCard,
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
  const { Braze, refreshDynamicContent } = useBrazeContentCard();
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

    const learnCards = filterByPage(mobileContentCards, ContentCardLocation.Learn)
      .map(card => mapAsLearnContentCard(card))
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
    dispatch(setDynamicContentLearnCards(learnCards));
    dispatch(setIsDynamicContentLoading(false));
    dispatch(setDynamicContentLandingPageStickyCtaCards(landingPageStickyCtaCards));
  }, [Braze, dismissedContentCardsIds, dispatch]);

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
