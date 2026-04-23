import {
  closeDialog,
  openDialog,
  selectIsDialogOpen,
  type DialogId,
} from "~/renderer/reducers/dialogs";
import type { State } from "~/renderer/reducers";

const DIALOG_ID: DialogId = "FINISH_POST_ONBOARDING";

export const openFinishPostOnboarding = () => openDialog(DIALOG_ID);
export const closeFinishPostOnboarding = () => closeDialog(DIALOG_ID);
export const selectIsFinishPostOnboardingOpen = (state: Pick<State, "dialogs">) =>
  selectIsDialogOpen(state, DIALOG_ID);
