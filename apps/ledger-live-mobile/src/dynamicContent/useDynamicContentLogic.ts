import { processGenericAwarenessModalBrazeCards } from "@ledgerhq/live-common/genericAwarenessModal";
import isEqual from "lodash/isEqual";
import { useCallback } from "react";
import { useSelector, useDispatch, useStore } from "~/context/hooks";
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
import {
  replaceBrazeGenericAwarenessModalContentCards,
  selectGenericAwarenessModalContentCards,
} from "~/reducers/genericAwarenessModal";

const EMPTY_DISMISSED_CONTENT_CARDS = {};

export const useDynamicContentLogic = () => {
  const dispatch = useDispatch();
  const store = useStore();
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

      // A list equal to the stored one keeps its reference: a new one re-renders all its readers.
      const state = store.getState();
      const { dynamicContent } = state;
      const storedModalCards = selectGenericAwarenessModalContentCards(state);
      const modalCards = [
        ...storedModalCards.filter(card => card.isLocal),
        ...genericAwarenessModalContentCards,
      ];
      if (!isEqual(dynamicContent.categoriesCards, categoriesCards))
        dispatch(setDynamicContentCategoriesCards(categoriesCards));
      if (!isEqual(dynamicContent.mobileCards, mobileContentCards))
        dispatch(setDynamicContentMobileCards(mobileContentCards));
      if (!isEqual(dynamicContent.walletCards, walletCards))
        dispatch(setDynamicContentWalletCards(walletCards));
      if (!isEqual(dynamicContent.assetsCards, assetCards))
        dispatch(setDynamicContentAssetsCards(assetCards));
      if (!isEqual(dynamicContent.notificationCards, notificationCards))
        dispatch(setDynamicContentNotificationCards(notificationCards));
      if (!isEqual(dynamicContent.landingPageStickyCtaCards, landingPageStickyCtaCards))
        dispatch(setDynamicContentLandingPageStickyCtaCards(landingPageStickyCtaCards));
      if (!isEqual(storedModalCards, modalCards))
        dispatch(replaceBrazeGenericAwarenessModalContentCards(genericAwarenessModalContentCards));
      if (dynamicContent.isLoading) dispatch(setIsDynamicContentLoading(false));
    },
    [dismissedContentCards, dispatch, store],
  );

  const clearOldDismissedContentCards = useCallback(() => {
    const oldCampaignIds = getOldCampaignIds(dismissedContentCards || {});
    if (oldCampaignIds.length > 0) {
      dispatch(clearDismissedContentCards(oldCampaignIds));
    }
  }, [dismissedContentCards, dispatch]);

  const setDynamicContentLoading = useCallback(
    (isLoading: boolean) => {
      if (store.getState().dynamicContent.isLoading !== isLoading) {
        dispatch(setIsDynamicContentLoading(isLoading));
      }
    },
    [dispatch, store],
  );

  return {
    updateDynamicContent,
    clearOldDismissedContentCards,
    setDynamicContentLoading,
  };
};
