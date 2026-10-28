import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import { ContactAvatar, useContactDisplayName } from "@features/platform-contacts";
import { useContactsCompactListCopy } from "../../copy/useContactsCompactListCopy";
import type { ContactsCompactListProps } from "./ContactsCompactList.types";
import {
  getCompactContactAddressDescription,
  getDisplayedCompactContacts,
} from "./utils/ContactsCompactList.utils";

export function ContactsCompactList({
  contacts,
  maxContacts,
  onSelectContact,
  testID = "contacts-compact-list",
}: ContactsCompactListProps): React.JSX.Element {
  const labels = useContactsCompactListCopy();
  const displayedContacts = getDisplayedCompactContacts(contacts, maxContacts);
  const getDisplayName = useContactDisplayName();

  return (
    <div className="flex flex-col" data-testid={testID}>
      {displayedContacts.map(contact => (
        <ListItem
          key={contact.id}
          onClick={() => onSelectContact(contact)}
          data-testid={`contacts-compact-row-${contact.id}`}
        >
          <ListItemLeading>
            <ContactAvatar
              contactId={contact.id}
              name={contact.name}
              isMe={contact.isMe}
              size="md"
              ariaHidden
            />
            <ListItemContent>
              <ListItemTitle>{getDisplayName(contact)}</ListItemTitle>
              <ListItemDescription>
                {getCompactContactAddressDescription(contact, labels)}
              </ListItemDescription>
            </ListItemContent>
          </ListItemLeading>
        </ListItem>
      ))}
    </div>
  );
}
