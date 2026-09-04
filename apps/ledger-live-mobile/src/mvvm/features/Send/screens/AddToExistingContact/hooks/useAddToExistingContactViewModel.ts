import { useCallback, useMemo, useState } from "react";
import type { Contact, ContactId } from "@domain/entity-contact";
import { useContacts, useContactsMeContact } from "@features/platform-contacts";
import {
  useContactsSearchViewModel,
  type ContactsListViewLabels,
} from "@features/flow-contacts-list";
import { USER_AVATAR_URL } from "LLM/components/UserAvatar/constants";
import { useTranslation } from "~/context/Locale";

export type UseAddToExistingContactViewModelOptions = Readonly<{
  startForContact: (contact: Contact) => Promise<void>;
}>;

export function useAddToExistingContactViewModel({
  startForContact,
}: UseAddToExistingContactViewModelOptions) {
  const { t } = useTranslation();
  const contacts = useContacts();
  const meContact = useContactsMeContact();
  const [searchQuery, setSearchQuery] = useState("");

  const labels = useMemo(
    (): ContactsListViewLabels => ({
      title: t("send.newSendFlow.addContact.selectContact"),
      searchPlaceholder: t("contacts.searchPlaceholder"),
      searchNoResults: t("contacts.searchNoResults"),
      addContact: t("contacts.addContact"),
      formatAddressCount: count => t("contacts.addressCount", { count }),
      formatMeDisplayName: name => t("contacts.detail.meDisplayName", { name }),
    }),
    [t],
  );

  const listViewModel = useContactsSearchViewModel(searchQuery, labels.formatMeDisplayName);

  const onSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const onSelectContact = useCallback(
    (contactId: ContactId) => {
      const selectedContact =
        contacts.find(contact => contact.id === contactId) ??
        (meContact.id === contactId ? meContact : undefined);

      if (!selectedContact) {
        return;
      }

      void startForContact(selectedContact);
    },
    [contacts, meContact, startForContact],
  );

  const resetSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  return {
    listViewModel,
    labels,
    searchQuery,
    meAvatarSrc: USER_AVATAR_URL,
    onSearchQueryChange,
    onSelectContact,
    resetSearch,
  };
}
