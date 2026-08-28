import type { Contact } from "@domain/entity-contact";
import type {
  AddContactDialogLifecycleCallbacks,
  AddContactDialogViewModel,
  ContactCreationPort,
  ContactsAddContactContentLabels,
} from "@features/flow-contacts-add-contact";
import type { OutgoingOperation } from "@features/platform-contacts";

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

/**
 * Native (Mobile) Pay contacts strip: a horizontal row with a leading Pay tile, then the saved
 * contacts. The Pay tile opens the Send flow. `onContactPress` is intentionally optional and left
 * unwired for now — a later ticket can pass it to turn contact tiles into Pay entry points without
 * touching the layout. `onSeeAll` opens the full contacts list when the saved contacts exceed the
 * strip cap. `outgoingOperations` are the host's account `OUT` operations used to order contacts by
 * last sent-to; omit for store order only.
 */
export type ContactsNativeProps = Readonly<{
  title: string;
  payLabel: string;
  onPay: () => void;
  onContactPress?: (contact: Contact) => void;
  onSeeAll: () => void;
  outgoingOperations?: readonly OutgoingOperation[];
}>;

export type ContactsViewNativeProps = ContactsNativeProps &
  Readonly<{
    contacts: readonly Contact[];
    hasMore: boolean;
  }>;
