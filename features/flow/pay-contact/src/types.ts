import type { Contact } from "@domain/entity-contact";
import type {
  AddContactDialogLifecycleCallbacks,
  ContactCreationPort,
} from "@features/flow-contacts-add-contact";

export type EmptyStateLabels = Readonly<{
  info: string;
  addContactLabel: string;
}>;

export type EmptyStateProps = EmptyStateLabels & Readonly<{ onAddContact: () => void }>;

export type PayAddContactProps = Readonly<{
  contactCreation: ContactCreationPort;
  onRequestAddContact: (onAllowed: () => void) => void;
  onSaveSuccess?: (contact: Contact) => void;
  callbacks?: AddContactDialogLifecycleCallbacks;
}>;

export type ContactsTableLabels = Readonly<{
  name: string;
  addresses: string;
  transactions: string;
  formatTransactionCount: (count: number) => string;
  payAction: string;
  moreAction: string;
  viewContact: string;
  viewTransactions: string;
}>;

export type ContactRowViewModel = Readonly<{
  contact: Contact;
  transactionCount: number;
}>;
