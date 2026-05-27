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
  () => (dispatch: AppDispatch, getState: () => State) => {
    const state = getState();
    const campaignId = selectGenericAwarenessModalCampaignId(state);
    const contentCard = selectGenericAwarenessModalContentCardByCampaignId(state)(campaignId);

    if (contentCard?.id) {
      const dismissedAt = Date.now();
      // The id here is the campaign id, not the content card id
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
