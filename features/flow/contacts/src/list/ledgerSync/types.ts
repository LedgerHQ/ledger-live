import type { ContactsPageProps } from "../types";

export type ContactsLedgerSyncStatus = "ready" | "checking" | "inactive";

export type ContactsLedgerSyncIntroduction = Readonly<{
  isOpen: boolean;
  description: string;
  dismissLabel: string;
  onDismiss: () => void;
}>;

export type ContactsPageWebProps = ContactsPageProps &
  Readonly<{
    ledgerSyncStatus: ContactsLedgerSyncStatus;
    ledgerSyncIntroduction: ContactsLedgerSyncIntroduction;
  }>;
