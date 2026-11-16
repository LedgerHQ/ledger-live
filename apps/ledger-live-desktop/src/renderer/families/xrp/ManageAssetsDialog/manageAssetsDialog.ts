import {
  openDialog,
  closeDialog,
  selectIsDialogOpen,
  type DialogId,
} from "~/renderer/reducers/dialogs";
import type { State } from "~/renderer/reducers";

const DIALOG_ID: DialogId = "XRP_MANAGE_ASSETS";

export const openManageAssets = () => openDialog(DIALOG_ID);
export const closeManageAssets = () => closeDialog(DIALOG_ID);
export const selectIsManageAssetsOpen = (state: Pick<State, "dialogs">) =>
  selectIsDialogOpen(state, DIALOG_ID);
