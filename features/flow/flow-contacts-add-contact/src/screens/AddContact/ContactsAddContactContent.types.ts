import type { AddContactContentViewModel } from "./types";

export type ContactsAddContactContentProps = AddContactContentViewModel &
  Readonly<{
    /** @platform native Focuses the name field once the host sheet has settled. */
    autoFocus?: boolean;
  }>;
