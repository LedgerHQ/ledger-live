import { processGenericAwarenessModalBrazeCards } from "@ledgerhq/live-common/genericAwarenessModal";
import { useCallback } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
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
import { replaceBrazeGenericAwarenessModalContentCards } from "~/reducers/genericAwarenessModal";

const EMPTY_DISMISSED_CONTENT_CARDS = {};

export const useDynamicContentLogic = () => {
  const dispatch = useDispatch();
  const dismissedContentCards =
    useSelector(dismissedContentCardsSelector) ?? EMPTY_DISMISSED_CONTENT_CARDS;

  const updateDynamicContent = useCallback(
    (contentCards: BrazeContentCard[]) => {
      const dismissedContentCardsIds = Object.keys(dismissedContentCards);
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
        .sort((a, b) => b.createdAt - a.createdAt);

      const genericAwarenessModalContentCards = processGenericAwarenessModalBrazeCards(
        filterByPage(mobileContentCards, ContentCardLocation.GenericAwarenessModal),
      );

      dispatch(setDynamicContentCategoriesCards(categoriesCards));
      dispatch(setDynamicContentMobileCards(mobileContentCards));
      dispatch(setDynamicContentWalletCards(walletCards));
      dispatch(setDynamicContentAssetsCards(assetCards));
      dispatch(setDynamicContentNotificationCards(notificationCards));
      dispatch(setDynamicContentLandingPageStickyCtaCards(landingPageStickyCtaCards));
      dispatch(replaceBrazeGenericAwarenessModalContentCards(genericAwarenessModalContentCards));
      dispatch(setIsDynamicContentLoading(false));
    },
    [dismissedContentCards, dispatch],
  );

  const clearOldDismissedContentCards = useCallback(() => {
    const oldCampaignIds = getOldCampaignIds(dismissedContentCards || {});
    if (oldCampaignIds.length > 0) {
      dispatch(clearDismissedContentCards(oldCampaignIds));
    }
  }, [dismissedContentCards, dispatch]);

  const setDynamicContentLoading = useCallback(
    (isLoading: boolean) => dispatch(setIsDynamicContentLoading(isLoading)),
    [dispatch],
  );

  return {
    updateDynamicContent,
    clearOldDismissedContentCards,
    setDynamicContentLoading,
  };
};
