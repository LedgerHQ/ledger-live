import type { GenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal";
import { openGenericAwarenessModalDialog } from "LLD/features/GenericAwarenessModal/genericAwarenessModalDialog";
import { removeDismissedContentCards } from "~/renderer/actions/settings";
import { setGenericAwarenessModalContentCards } from "~/renderer/reducers/genericAwarenessModalSlice";
import type { State } from "~/renderer/reducers";
import { developerModeSelector, dismissedContentCardsSelector } from "~/renderer/reducers/settings";
import type { AppDispatch } from "~/state-manager/configureStore";
import { getDevGenericAwarenessModalCards } from "./devCardsStore";

const isDevGenericAwarenessModalQaEnabled = (getState: () => State): boolean =>
  developerModeSelector(getState());

const getDismissedCampaignIdsToClear = (
  contentCards: readonly GenericAwarenessModalContentCard[],
  dismissedContentCards: Readonly<Record<string, number>>,
): string[] => contentCards.map(card => card.id).filter(id => id in dismissedContentCards);

const applyContentCardsToStore =
  (contentCards: GenericAwarenessModalContentCard[]) =>
  (dispatch: AppDispatch, getState: () => State) => {
    const dismissedContentCards = dismissedContentCardsSelector(getState()) ?? {};
    const dismissedCampaignIdsToClear = getDismissedCampaignIdsToClear(
      contentCards,
      dismissedContentCards,
    );

    if (dismissedCampaignIdsToClear.length > 0) {
      dispatch(removeDismissedContentCards({ ids: dismissedCampaignIdsToClear }));
    }

    dispatch(setGenericAwarenessModalContentCards(contentCards));
  };

export const syncDevCardsToRedux = () => (dispatch: AppDispatch, getState: () => State) => {
  if (!isDevGenericAwarenessModalQaEnabled(getState)) {
    return;
  }

  applyContentCardsToStore(getDevGenericAwarenessModalCards())(dispatch, getState);
};

export const replaceDevCardsInRedux =
  (cards: GenericAwarenessModalContentCard[]) => (dispatch: AppDispatch, getState: () => State) => {
    if (!isDevGenericAwarenessModalQaEnabled(getState)) {
      return;
    }

    applyContentCardsToStore(cards)(dispatch, getState);
  };

/** Syncs dev cards to Redux, then opens the modal for the given campaign id. */
export const previewDevGenericAwarenessModalCard =
  (campaignId: string) => (dispatch: AppDispatch, getState: () => State) => {
    if (!isDevGenericAwarenessModalQaEnabled(getState)) {
      return;
    }

    applyContentCardsToStore(getDevGenericAwarenessModalCards())(dispatch, getState);
    openGenericAwarenessModalDialog({ campaignId })(dispatch, getState);
  };
