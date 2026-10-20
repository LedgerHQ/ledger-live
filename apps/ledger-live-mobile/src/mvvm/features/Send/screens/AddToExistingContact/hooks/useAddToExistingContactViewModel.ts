import { track } from "@shared/analytics";
import { useCallback, useState } from "react";
import type { Contact, ContactId } from "@domain/entity-contact";
import { useContacts, useContactsMeContact } from "@features/platform-contacts";
import { useContactsSearchViewModel } from "@features/flow-contacts-list";
import { useSendFlowTrackingProperties } from "LLM/features/Send/hooks/useSendFlowTrackingProperties";

export type UseAddToExistingContactViewModelOptions = Readonly<{
  startForContact: (contact: Contact) => Promise<void>;
}>;

export function useAddToExistingContactViewModel({
  startForContact,
}: UseAddToExistingContactViewModelOptions) {
  const contacts = useContacts();
  const meContact = useContactsMeContact();
  const trackingProperties = useSendFlowTrackingProperties();
  const [searchQuery, setSearchQuery] = useState("");

  const listViewModel = useContactsSearchViewModel(searchQuery);

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

      track("button_clicked", {
        button: "contact",
        page: "select existing contact",
        ...trackingProperties,
      });
      void startForContact(selectedContact);
    },
    [contacts, meContact, startForContact, trackingProperties],
  );

  const resetSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  return {
    listViewModel,
    searchQuery,
    onSearchQueryChange,
    onSelectContact,
    resetSearch,
  };
}
