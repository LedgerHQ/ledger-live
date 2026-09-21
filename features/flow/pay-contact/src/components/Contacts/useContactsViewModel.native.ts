import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import {
  sortContactsByLastSentThenLastAdded,
  summarizeOutgoingOperationsByContact,
  useContacts,
} from "@features/platform-contacts";
import { placeMeFirst } from "../../model/placeMeFirst";
import type { ContactsNativeProps, ContactsViewNativeProps } from "../../types";

const MAX_CONTACTS_DISPLAYED = 8;

const EMPTY_OPERATIONS = [] as const;

export function useContactsViewModel({
  outgoingOperations = EMPTY_OPERATIONS,
  ...props
}: ContactsNativeProps): ContactsViewNativeProps {
  const { t } = useTranslation();
  const contacts = useContacts();
  const sortedContacts = useMemo(() => {
    const others = contacts.filter(contact => !contact.isMe);
    const summaries = summarizeOutgoingOperationsByContact(others, outgoingOperations);

    return placeMeFirst([
      ...contacts.filter(contact => contact.isMe),
      ...sortContactsByLastSentThenLastAdded(others, summaries),
    ]);
  }, [contacts, outgoingOperations]);

  const hasMore = sortedContacts.length > MAX_CONTACTS_DISPLAYED;
  const displayedContacts = useMemo(
    () => sortedContacts.slice(0, MAX_CONTACTS_DISPLAYED),
    [sortedContacts],
  );

  return {
    ...props,
    title: t("payTab.contacts.title"),
    payLabel: t("payTab.contacts.pay"),
    contacts: displayedContacts,
    hasMore,
  };
}
