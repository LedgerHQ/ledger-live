import { processGenericAwarenessModalBrazeCards } from "@ledgerhq/live-common/genericAwarenessModal";
import isEqual from "lodash/isEqual";
import { useCallback } from "react";
import { useSelector, useDispatch, useStore } from "~/context/hooks";
import { setDynamicContentBrazeCards, setIsDynamicContentLoading } from "../actions/dynamicContent";
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
import { markBrazePublish } from "LLM/utils/logStartup/logBrazePublish";
import { selectGenericAwarenessModalContentCards } from "~/reducers/genericAwarenessModal";

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

      markBrazePublish(
        `built (${mobileContentCards.length} mobile, ${walletCards.length} wallet, ` +
          `${assetCards.length} asset, ${notificationCards.length} notification, ` +
          `${categoriesCards.length} category, ${landingPageStickyCtaCards.length} sticky, ` +
          `${genericAwarenessModalContentCards.length} modal)`,
      );
      // Only the lists that changed go in: an unchanged one keeps its reference, so its readers
      // do not render again.
      const state = store.getState();
      const { dynamicContent } = state;
      const storedModalCards = selectGenericAwarenessModalContentCards(state);
      const changed = <T>(stored: T, next: T): T | undefined =>
        isEqual(stored, next) ? undefined : next;
      const modalCards = [
        ...storedModalCards.filter(card => card.isLocal),
        ...genericAwarenessModalContentCards,
      ];
      const update = {
        categoriesCards: changed(dynamicContent.categoriesCards, categoriesCards),
        mobileCards: changed(dynamicContent.mobileCards, mobileContentCards),
        walletCards: changed(dynamicContent.walletCards, walletCards),
        assetsCards: changed(dynamicContent.assetsCards, assetCards),
        notificationCards: changed(dynamicContent.notificationCards, notificationCards),
        landingPageStickyCtaCards: changed(
          dynamicContent.landingPageStickyCtaCards,
          landingPageStickyCtaCards,
        ),
        genericAwarenessModalCards: isEqual(storedModalCards, modalCards)
          ? undefined
          : genericAwarenessModalContentCards,
      };
      if (dynamicContent.isLoading || Object.values(update).some(list => list !== undefined)) {
        dispatch(setDynamicContentBrazeCards(update));
      }
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
