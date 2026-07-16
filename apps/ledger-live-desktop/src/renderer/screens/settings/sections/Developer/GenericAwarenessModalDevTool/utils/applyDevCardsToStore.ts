import type { GenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal";
import { openGenericAwarenessModalDialog } from "LLD/features/GenericAwarenessModal/genericAwarenessModalDialog";
import { isAppStartContentCardId } from "LLD/features/GenericAwarenessModal/utils/isAppStartContentCardId";
import { removeDismissedContentCards } from "~/renderer/actions/settings";
import {
  getGamDismissedCampaignIds,
  setGenericAwarenessModalContentCards,
} from "~/renderer/reducers/genericAwarenessModalSlice";
import type { State } from "~/renderer/reducers";
import { developerModeSelector, dismissedContentCardsSelector } from "~/renderer/reducers/settings";
import type { AppDispatch } from "~/state-manager/configureStore";
import { getDevGenericAwarenessModalCards } from "./devCardsStore";

export type SyncDevCardsToReduxOptions = {
  /** Skips APP_START dev cards in Redux (save-to-store without immediate APP_START modal). */
  excludeAppStart?: boolean;
  /** Keeps APP_START dismiss entries when syncing APP_START cards (launch / portfolio hydration). */
  preserveAppStartDismiss?: boolean;
};

const isDevGenericAwarenessModalQaEnabled = (getState: () => State): boolean =>
  developerModeSelector(getState());

const getDismissedCampaignIdsToClear = (
  contentCards: readonly GenericAwarenessModalContentCard[],
  dismissedContentCards: Readonly<Record<string, number>>,
): string[] =>
  contentCards.map(card => card.id).filter(id => Object.hasOwn(dismissedContentCards, id));

const applyContentCardsToStore =
  (contentCards: GenericAwarenessModalContentCard[], options?: SyncDevCardsToReduxOptions) =>
  (dispatch: AppDispatch, getState: () => State) => {
    const dismissedContentCards = dismissedContentCardsSelector(getState()) ?? {};
    const dismissedCampaignIdsToClear = getDismissedCampaignIdsToClear(
      contentCards,
      dismissedContentCards,
    ).filter(id => {
      if (options?.excludeAppStart && isAppStartContentCardId(id)) {
        return false;
      }
      if (options?.preserveAppStartDismiss && isAppStartContentCardId(id)) {
        return false;
      }
      return true;
    });

    if (dismissedCampaignIdsToClear.length > 0) {
      dispatch(removeDismissedContentCards({ ids: dismissedCampaignIdsToClear }));
    }

    dispatch(setGenericAwarenessModalContentCards(contentCards));
  };

const getDevCardsForRedux = (options?: SyncDevCardsToReduxOptions) => {
  const devCards = getDevGenericAwarenessModalCards();
  if (!options?.excludeAppStart) {
    return devCards;
  }
  return devCards.filter(card => !isAppStartContentCardId(card.id));
};

export const syncDevCardsToRedux =
  (options?: SyncDevCardsToReduxOptions) => (dispatch: AppDispatch, getState: () => State) => {
    if (!isDevGenericAwarenessModalQaEnabled(getState)) {
      return;
    }

    const devCards = getDevCardsForRedux(options);

    if (options?.excludeAppStart) {
      const appStartCardsInStore = getState().genericAwarenessModal.contentCards.filter(card =>
        isAppStartContentCardId(card.id),
      );
      applyContentCardsToStore([...appStartCardsInStore, ...devCards], options)(dispatch, getState);
      return;
    }

    applyContentCardsToStore(devCards, options)(dispatch, getState);
  };

/** Merges persisted APP_START dev cards into Redux without clearing their dismiss state. */
export const syncDevAppStartCardsToRedux = () => (dispatch: AppDispatch, getState: () => State) => {
  if (!isDevGenericAwarenessModalQaEnabled(getState)) {
    return;
  }

  const appStartDevCards = getDevGenericAwarenessModalCards().filter(card =>
    isAppStartContentCardId(card.id),
  );
  if (appStartDevCards.length === 0) {
    return;
  }

  const state = getState();
  const appStartIds = new Set(appStartDevCards.map(card => card.id));
  const mergedCards = [
    ...state.genericAwarenessModal.contentCards.filter(card => !appStartIds.has(card.id)),
    ...appStartDevCards,
  ];

  applyContentCardsToStore(mergedCards, { preserveAppStartDismiss: true })(dispatch, getState);
};

/** Removes GAM-related entries from settings.dismissedContentCards for the given campaign ids (QA only). */
export const removeGamDismissedCampaignIds =
  (ids: readonly string[]) => (dispatch: AppDispatch, getState: () => State) => {
    if (!isDevGenericAwarenessModalQaEnabled(getState)) {
      return;
    }

    const state = getState();
    const gamDismissedIds = new Set(
      getGamDismissedCampaignIds(
        state.genericAwarenessModal.contentCards,
        dismissedContentCardsSelector(state),
      ),
    );
    const idsToRemove = ids.filter(id => gamDismissedIds.has(id));
    if (idsToRemove.length === 0) {
      return;
    }

    dispatch(removeDismissedContentCards({ ids: idsToRemove }));
  };

const removeDevCampaignFromRedux =
  (id: string) => (dispatch: AppDispatch, getState: () => State) => {
    if (!isDevGenericAwarenessModalQaEnabled(getState)) {
      return;
    }

    const state = getState();
    dispatch(
      setGenericAwarenessModalContentCards(
        state.genericAwarenessModal.contentCards.filter(card => card.id !== id),
      ),
    );
  };

/** Clears GAM-related entries from settings.dismissedContentCards (QA only). */
export const clearGamDismissedContentCards =
  () => (dispatch: AppDispatch, getState: () => State) => {
    if (!isDevGenericAwarenessModalQaEnabled(getState)) {
      return;
    }

    const state = getState();
    const ids = getGamDismissedCampaignIds(
      state.genericAwarenessModal.contentCards,
      dismissedContentCardsSelector(state),
    );
    if (ids.length === 0) {
      return;
    }

    dispatch(removeDismissedContentCards({ ids }));

    const clearedAppStartDevCards = getDevGenericAwarenessModalCards().filter(
      card => ids.includes(card.id) && isAppStartContentCardId(card.id),
    );
    if (clearedAppStartDevCards.length === 0) {
      return;
    }

    const storedIds = new Set(state.genericAwarenessModal.contentCards.map(card => card.id));
    const cardsToRestore = clearedAppStartDevCards.filter(card => !storedIds.has(card.id));
    if (cardsToRestore.length === 0) {
      return;
    }

    dispatch(
      setGenericAwarenessModalContentCards([
        ...state.genericAwarenessModal.contentCards,
        ...cardsToRestore,
      ]),
    );
  };

export const replaceDevCardsInRedux =
  (cards: GenericAwarenessModalContentCard[]) => (dispatch: AppDispatch, getState: () => State) => {
    if (!isDevGenericAwarenessModalQaEnabled(getState)) {
      return;
    }

    applyContentCardsToStore(cards)(dispatch, getState);
  };

export const removeDevGenericAwarenessModalCardFromStore =
  (id: string) => (dispatch: AppDispatch, getState: () => State) => {
    if (!isDevGenericAwarenessModalQaEnabled(getState)) {
      return;
    }

    // Order matters: clear dismiss while the id is still in Redux (getGamDismissedCampaignIds reads contentCards).
    removeGamDismissedCampaignIds([id])(dispatch, getState);
    removeDevCampaignFromRedux(id)(dispatch, getState);
    dispatch(syncDevCardsToRedux({ excludeAppStart: true }));
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
