import {
  closeDialog,
  openDialog,
  selectIsDialogOpen,
  type DialogId,
} from "~/renderer/reducers/dialogs";
import type { State } from "~/renderer/reducers";

const DIALOG_ID: DialogId = "WALLET_API_ACCOUNT_DATA_SIGN";

export const openWalletApiAccountDataSignDialog = () => openDialog(DIALOG_ID);
export const closeWalletApiAccountDataSignDialog = () => closeDialog(DIALOG_ID);
export const selectIsWalletApiAccountDataSignDialogOpen = (state: Pick<State, "dialogs">) =>
  selectIsDialogOpen(state, DIALOG_ID);
