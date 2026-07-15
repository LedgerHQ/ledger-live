import { openDialog, closeDialog } from "~/renderer/reducers/dialogs";
import type { State } from "~/renderer/reducers";
import {
  openAccountPublicKeyUnavailableDialog,
  closeAccountPublicKeyUnavailableDialog,
  selectIsAccountPublicKeyUnavailableDialogOpen,
} from "./accountPublicKeyUnavailableDialog";

const DIALOG_ID = "ACCOUNT_PUBLIC_KEY_UNAVAILABLE";

describe("accountPublicKeyUnavailableDialog", () => {
  it("open/close target the ACCOUNT_PUBLIC_KEY_UNAVAILABLE dialog id", () => {
    expect(openAccountPublicKeyUnavailableDialog()).toEqual(openDialog(DIALOG_ID));
    expect(closeAccountPublicKeyUnavailableDialog()).toEqual(closeDialog(DIALOG_ID));
  });

  it("selector reflects the dialog open state", () => {
    const opened = { dialogs: { [DIALOG_ID]: true } } as unknown as State;
    const closed = { dialogs: {} } as unknown as State;
    expect(selectIsAccountPublicKeyUnavailableDialogOpen(opened)).toBe(true);
    expect(selectIsAccountPublicKeyUnavailableDialogOpen(closed)).toBe(false);
  });
});
