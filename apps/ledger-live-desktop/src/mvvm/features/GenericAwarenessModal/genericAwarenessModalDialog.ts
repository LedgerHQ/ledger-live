import { setDismissedContentCards } from "~/renderer/actions/settings";
import {
  closeDialog,
  openDialog,
  selectIsDialogOpen,
  type DialogId,
} from "~/renderer/reducers/dialogs";
import {
  filterDismissedGenericAwarenessModalContentCards,
  selectGenericAwarenessModalCampaignId,
  selectGenericAwarenessModalContentCardByCampaignId,
  setGenericAwarenessModalCampaignId,
  setGenericAwarenessModalContentCards,
} from "~/renderer/reducers/genericAwarenessModalSlice";
import type { State } from "~/renderer/reducers";
import { dismissedContentCardsSelector } from "~/renderer/reducers/settings";
import type { AppDispatch } from "~/state-manager/configureStore";

const DIALOG_ID: DialogId = "GENERIC_AWARENESS_MODAL";

const isAppStartContentCardId = (contentCardId: string) =>
  contentCardId.toLowerCase().startsWith("app_start");

export type CloseGenericAwarenessModalDialogOptions = {
  /** When true, APP_START campaigns are persisted as dismissed and removed from the store. */
  dismissAppStart?: boolean;
};

export const openGenericAwarenessModalDialog =
  (options?: { campaignId?: string }) => (dispatch: AppDispatch, getState: () => State) => {
    const campaignId = options?.campaignId;
    dispatch(setGenericAwarenessModalCampaignId(campaignId));

    const contentCard = selectGenericAwarenessModalContentCardByCampaignId(getState())(campaignId);
    if (contentCard) {
      dispatch(openDialog(DIALOG_ID));
    }
  };

export const closeGenericAwarenessModalDialog =
  (options?: CloseGenericAwarenessModalDialogOptions) =>
  (dispatch: AppDispatch, getState: () => State) => {
    const state = getState();
    const campaignId = selectGenericAwarenessModalCampaignId(state);
    const contentCard = selectGenericAwarenessModalContentCardByCampaignId(state)(campaignId);

    if (options?.dismissAppStart && contentCard?.id && isAppStartContentCardId(contentCard.id)) {
      const dismissedAt = Date.now();
      dispatch(setDismissedContentCards({ id: contentCard.id, timestamp: dismissedAt }));
      const dismissedIds = [
        ...Object.keys(dismissedContentCardsSelector(state) ?? {}),
        contentCard.id,
      ];
      const filteredCards = filterDismissedGenericAwarenessModalContentCards(
        state.genericAwarenessModal.contentCards,
        dismissedIds,
      );
      dispatch(setGenericAwarenessModalContentCards(filteredCards));
    }

    dispatch(closeDialog(DIALOG_ID));
    dispatch(setGenericAwarenessModalCampaignId(undefined));
  };

export const selectIsGenericAwarenessModalOpen = (state: Pick<State, "dialogs">) =>
  selectIsDialogOpen(state, DIALOG_ID);
