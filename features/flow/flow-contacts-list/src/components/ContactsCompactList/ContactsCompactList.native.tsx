import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { ContactAvatar, useContactDisplayName } from "@features/platform-contacts";
import type { ContactsCompactListProps, ContactsCompactRowProps } from "../../types";
import {
  getCompactContactAddressDescription,
  getDisplayedCompactContacts,
} from "./utils/ContactsCompactList.utils";

export function ContactsCompactRow({
  contact,
  labels,
  onContactSelect,
}: ContactsCompactRowProps): React.JSX.Element {
  const getDisplayName = useContactDisplayName();

  return (
    <ListItem
      testID={`contacts-compact-row-${contact.id}`}
      onPress={() => onContactSelect(contact)}
      density="expanded"
      lx={{ marginHorizontal: "-s8" }}
    >
      <ListItemLeading>
        <ContactAvatar contactId={contact.id} name={contact.name} size="md" />
        <ListItemContent>
          <ListItemTitle>{getDisplayName(contact)}</ListItemTitle>
          <ListItemDescription>
            {getCompactContactAddressDescription(contact, labels)}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}

export function ContactsCompactList({
  contacts,
  labels,
  maxContacts,
  onContactSelect,
}: ContactsCompactListProps): React.JSX.Element {
  const displayedContacts = getDisplayedCompactContacts(contacts, maxContacts);

  return (
    <>
      {displayedContacts.map(contact => (
        <ContactsCompactRow
          key={contact.id}
          contact={contact}
          labels={labels}
          onContactSelect={onContactSelect}
        />
      ))}
    </>
  );
}
