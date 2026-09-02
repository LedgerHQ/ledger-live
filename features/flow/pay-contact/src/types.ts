import type { ReactNode } from "react";
import type { Contact, ContactAddress } from "@domain/entity-contact";
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
  viewContact: string;
  viewTransactions: string;
}>;

export type ContactsProps = Readonly<{
  addContact: PayAddContactProps;
  renderAddresses: (addresses: Contact["addresses"]) => ReactNode;
  onContactPress?: (contact: Contact) => void;
  onViewContact?: (contact: Contact) => void;
  onViewTransactions?: (contact: Contact) => void;
  operations?: readonly ContactOperation[];
}>;

export type ContactRowViewModel = Readonly<{
  contact: Contact;
  transactionCount: number;
}>;

export type ContactsViewProps = Pick<
  ContactsProps,
  "renderAddresses" | "onContactPress" | "onViewTransactions" | "onViewContact"
> &
  Readonly<{
    title: string;
    labels: ContactsTableLabels;
    isEmpty: boolean;
    rows: readonly ContactRowViewModel[];
    emptyState: EmptyStateProps;
    addContactDialog: AddContactDialogViewModel;
  }>;

export type ContactsNativeProps = Readonly<{
  onPay: () => void;
  onContactPress?: (contact: Contact) => void;
  onSeeAll: () => void;
  outgoingOperations?: readonly OutgoingOperation[];
}>;

export type ContactsViewNativeProps = ContactsNativeProps &
  Readonly<{
    title: string;
    payLabel: string;
    contacts: readonly Contact[];
    hasMore: boolean;
  }>;

export type ContactAddressPickerProps = Readonly<{
  isOpen: boolean;
  contact: Contact | null;
  onClose: () => void;
  onSelectAddress: (address: ContactAddress) => void;
  onAddNewContact?: () => void;
}>;
