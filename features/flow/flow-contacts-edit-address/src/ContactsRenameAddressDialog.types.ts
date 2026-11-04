import type { RenameAddressDialogViewModel } from "./types";

export type ContactsRenameAddressDialogProps = RenameAddressDialogViewModel &
  Readonly<{
    isDeviceRequired: boolean;
    supportsDomain: boolean;
    /** @platform native Focuses the address field once the host sheet has settled. */
    autoFocus?: boolean;
  }>;
