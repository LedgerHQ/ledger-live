import type { Contact } from "@domain/entity-contact";
import type {
  AddContactDialogLifecycleCallbacks,
  AddContactDialogViewModel,
  ContactCreationPort,
  ContactsAddContactContentLabels,
} from "@features/flow-contacts-add-contact";

export type EmptyStateLabels = Readonly<{
  info: string;
  addContactLabel: string;
}>;

export type EmptyStateProps = EmptyStateLabels & Readonly<{ onAddContact: () => void }>;

/**
 * Everything the host injects so the Pay contacts section can open the shared Add contact dialog.
 * `onRequestAddContact` lets the host gate the CTA (e.g. Ledger Sync) before the dialog opens.
 */
export type PayAddContactProps = Readonly<{
  labels: ContactsAddContactContentLabels;
  contactCreation: ContactCreationPort;
  onRequestAddContact: (onAllowed: () => void) => void;
  onSaveSuccess?: (contact: Contact) => void;
  callbacks?: AddContactDialogLifecycleCallbacks;
}>;

export type ContactsProps = Readonly<{
  title: string;
  emptyState: EmptyStateLabels;
  addContact: PayAddContactProps;
}>;

export type ContactsViewProps = Readonly<{
  title: string;
  isEmpty: boolean;
  emptyState: EmptyStateProps;
  addContactDialog: AddContactDialogViewModel;
}>;
