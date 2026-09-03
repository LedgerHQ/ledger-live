import { useCallback, useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { useAddContactDialogViewModel } from "@features/flow-contacts-add-contact";
import {
  sortContactsByLastSentThenLastAdded,
  summarizeContactOperationsByContact,
  useContacts,
} from "@features/platform-contacts";
import type {
  ContactRowViewModel,
  ContactsProps,
  ContactsTableLabels,
  ContactsViewProps,
} from "../../types";

const noop = () => undefined;
const EMPTY_OPERATIONS = [] as const;

export function useContactsViewModel({
  addContact,
  operations = EMPTY_OPERATIONS,
  ...props
}: ContactsProps): ContactsViewProps {
  const { t } = useTranslation();
  const contacts = useContacts();
  const rows = useMemo<readonly ContactRowViewModel[]>(() => {
    const savedContacts = contacts.filter(contact => !contact.isMe);
    const summaries = summarizeContactOperationsByContact(savedContacts, operations);

    return sortContactsByLastSentThenLastAdded(savedContacts, summaries).map(contact => ({
      contact,
      transactionCount: summaries[contact.id]?.txCount ?? 0,
    }));
  }, [contacts, operations]);
  const {
    labels: addContactLabels,
    contactCreation,
    onRequestAddContact,
    onSaveSuccess,
    callbacks,
  } = addContact;
  const addContactDialog = useAddContactDialogViewModel({
    contactCreation,
    labels: addContactLabels,
    onSaveSuccess: onSaveSuccess ?? noop,
    callbacks,
  });
  const onAddContact = useCallback(
    () => onRequestAddContact(addContactDialog.onOpen),
    [addContactDialog.onOpen, onRequestAddContact],
  );

  const labels = useMemo<ContactsTableLabels>(
    () => ({
      name: t("payTab.contacts.table.name"),
      addresses: t("payTab.contacts.table.addresses"),
      transactions: t("payTab.contacts.table.transactions"),
      formatTransactionCount: count => t("payTab.contacts.table.transactionCount", { count }),
      payAction: t("payTab.contacts.actions.pay"),
      moreAction: t("payTab.contacts.actions.more"),
      viewContact: t("payTab.contacts.actions.viewContact"),
      viewTransactions: t("payTab.contacts.actions.viewTransactions"),
    }),
    [t],
  );

  return {
    ...props,
    title: t("payTab.contacts.title"),
    labels,
    isEmpty: rows.length === 0,
    rows,
    emptyState: {
      info: t("payTab.contacts.empty.info"),
      addContactLabel: t("payTab.contacts.empty.addContact"),
      onAddContact,
    },
    addContactDialog,
  };
}
