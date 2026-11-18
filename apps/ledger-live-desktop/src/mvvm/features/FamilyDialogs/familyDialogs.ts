import {
  closeDialogWithData,
  openDialogWithData,
  selectDialogWithDataParams,
} from "~/renderer/reducers/dialogsWithData";
import type { DialogWithDataId } from "~/renderer/reducers/dialogsWithData";
import type { State } from "~/renderer/reducers";

const DIALOG_ID = "FAMILY_DIALOG" satisfies DialogWithDataId;

export const openFamilyDialog = (accountId: string, params: unknown) =>
  openDialogWithData({ id: DIALOG_ID, data: { accountId, params } });

export const closeFamilyDialog = () => closeDialogWithData(DIALOG_ID);

export const selectFamilyDialogParams = (state: Pick<State, "dialogsWithData">) =>
  selectDialogWithDataParams(state, DIALOG_ID);
