import {
  openDialog,
  closeDialog,
  selectIsDialogOpen,
  type DialogId,
} from "~/renderer/reducers/dialogs";
import type { State } from "~/renderer/reducers";
import type { PerpsSignData } from "./usePerpsSignViewModel";

const DIALOG_ID: DialogId = "PERPS_SIGNING";

let _pendingData: PerpsSignData | null = null;
export const setPerpsSignData = (data: PerpsSignData) => {
  _pendingData = data;
};
export const getPerpsSignData = (): PerpsSignData | null => _pendingData;
export const clearPerpsSignData = () => {
  _pendingData = null;
};

export const openPerpsSign = () => openDialog(DIALOG_ID);
export const closePerpsSign = () => closeDialog(DIALOG_ID);
export const selectIsPerpsSignOpen = (state: Pick<State, "dialogs">) =>
  selectIsDialogOpen(state, DIALOG_ID);
