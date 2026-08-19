import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import { ContactAvatar } from "@features/platform-contacts";
import type { ContactsCompactListProps } from "./types";
import {
  getCompactContactAddressDescription,
  getDisplayedCompactContacts,
} from "./ContactsCompactList.utils";

export function ContactsCompactList({
  contacts,
  labels,
  maxContacts,
  onContactSelect,
}: ContactsCompactListProps): React.JSX.Element {
  const displayedContacts = getDisplayedCompactContacts(contacts, maxContacts);

  return (
    <div className="flex flex-col" data-testid="contacts-compact-list">
      {displayedContacts.map(contact => (
        <ListItem
          key={contact.id}
          onClick={() => onContactSelect(contact)}
          data-testid={`contacts-compact-row-${contact.id}`}
        >
          <ListItemLeading>
            <ContactAvatar contactId={contact.id} name={contact.name} size="md" ariaHidden />
            <ListItemContent>
              <ListItemTitle>{contact.name}</ListItemTitle>
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
