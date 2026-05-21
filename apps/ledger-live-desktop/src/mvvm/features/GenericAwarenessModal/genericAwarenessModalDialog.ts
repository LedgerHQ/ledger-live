import {
  closeDialog,
  openDialog,
  selectIsDialogOpen,
  type DialogId,
} from "~/renderer/reducers/dialogs";
import {
  selectGenericAwarenessModalCampaignId,
  setGenericAwarenessModalCampaignId,
} from "~/renderer/reducers/genericAwarenessModalDialogSlice";
import type { State } from "~/renderer/reducers";
import type { AppDispatch } from "~/state-manager/configureStore";

const DIALOG_ID: DialogId = "GENERIC_AWARENESS_MODAL";

export const openGenericAwarenessModalDialog =
  (options?: { campaignId?: string }) => (dispatch: AppDispatch) => {
    dispatch(setGenericAwarenessModalCampaignId(options?.campaignId));
    dispatch(openDialog(DIALOG_ID));
  };

export const closeGenericAwarenessModalDialog = () => (dispatch: AppDispatch) => {
  dispatch(closeDialog(DIALOG_ID));
  dispatch(setGenericAwarenessModalCampaignId(undefined));
};

export const selectIsGenericAwarenessModalOpen = (state: Pick<State, "dialogs">) =>
  selectIsDialogOpen(state, DIALOG_ID);

export { selectGenericAwarenessModalCampaignId };
