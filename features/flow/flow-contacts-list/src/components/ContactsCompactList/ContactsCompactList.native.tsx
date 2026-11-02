import React from "react";
import type { Contact } from "@domain/entity-contact";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { ContactAvatar, useContactDisplayName } from "@features/platform-contacts";
import { useContactsCompactListCopy } from "../../copy/useContactsCompactListCopy";
import type { ContactsCompactListLabels } from "../../types";
import type { ContactsCompactListProps } from "./ContactsCompactList.types";
import {
  getCompactContactAddressDescription,
  getDisplayedCompactContacts,
} from "./utils/ContactsCompactList.utils";

type ContactsCompactRowProps = Readonly<{
  contact: Contact;
  labels: ContactsCompactListLabels;
  onSelectContact: (contact: Contact) => void;
}>;

function ContactsCompactRow({
  contact,
  labels,
  onSelectContact,
}: ContactsCompactRowProps): React.JSX.Element {
  const getDisplayName = useContactDisplayName();

  return (
    <ListItem
      testID={`contacts-compact-row-${contact.id}`}
      onPress={() => onSelectContact(contact)}
      density="expanded"
      lx={{ marginHorizontal: "-s8" }}
    >
      <ListItemLeading>
        <ContactAvatar contactId={contact.id} name={contact.name} isMe={contact.isMe} size="md" />
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
  maxContacts,
  onSelectContact,
  testID,
}: ContactsCompactListProps): React.JSX.Element {
  const labels = useContactsCompactListCopy();
  const displayedContacts = getDisplayedCompactContacts(contacts, maxContacts);

  return (
    <Box testID={testID}>
      {displayedContacts.map(contact => (
        <ContactsCompactRow
          key={contact.id}
          contact={contact}
          labels={labels}
          onSelectContact={onSelectContact}
        />
      ))}
    </Box>
  );
}
