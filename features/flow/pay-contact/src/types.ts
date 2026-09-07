import type { ReactNode } from "react";
import type { Contact } from "@domain/entity-contact";
import type {
  AddContactDialogLifecycleCallbacks,
  AddContactDialogViewModel,
  ContactCreationPort,
  ContactsAddContactContentLabels,
} from "@features/flow-contacts-add-contact";
import type { ContactOperation, OutgoingOperation } from "@features/platform-contacts";

export type EmptyStateLabels = Readonly<{
  info: string;
  addContactLabel: string;
}>;

export type EmptyStateProps = EmptyStateLabels & Readonly<{ onAddContact: () => void }>;

export type PayAddContactProps = Readonly<{
  labels: ContactsAddContactContentLabels;
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
  viewTransactions: string;
}>;

export type ContactsProps = Readonly<{
  title: string;
  emptyState: EmptyStateLabels;
  addContact: PayAddContactProps;
  labels: ContactsTableLabels;
  renderAddresses: (addresses: Contact["addresses"]) => ReactNode;
  onPayContact?: (contact: Contact) => void;
  onViewTransactions?: (contact: Contact) => void;
  operations?: readonly ContactOperation[];
}>;

export type ContactRowViewModel = Readonly<{
  contact: Contact;
  transactionCount: number;
}>;

export type ContactsViewProps = Pick<
  ContactsProps,
  "title" | "labels" | "renderAddresses" | "onPayContact" | "onViewTransactions"
> &
  Readonly<{
    isEmpty: boolean;
    rows: readonly ContactRowViewModel[];
    emptyState: EmptyStateProps;
    addContactDialog: AddContactDialogViewModel;
  }>;

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
