import type { RenameContactDialogViewModel } from "./types";

export type ContactsRenameContactDialogProps = RenameContactDialogViewModel &
  Readonly<{
    isDeviceRequired: boolean;
    /** @platform native Focuses the name field once the host sheet has settled. */
    autoFocus?: boolean;
  }>;
