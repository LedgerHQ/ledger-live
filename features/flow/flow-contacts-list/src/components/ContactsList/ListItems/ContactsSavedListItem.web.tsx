import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-react";
import { ContactAvatar } from "@features/platform-contacts";
import type { ContactsListItem } from "../../../types";

type ContactsSavedListItemProps = Readonly<{
  contact: ContactsListItem;
  formatAddressCount: (count: number) => string;
  onOpen: (contactId: ContactsListItem["contactId"]) => void;
}>;

export function ContactsSavedListItem({
  contact,
  formatAddressCount,
  onOpen,
}: ContactsSavedListItemProps): React.ReactNode {
  return (
    <ListItem
      onClick={() => onOpen(contact.contactId)}
      onPointerUp={event => event.currentTarget.blur()}
      data-testid={`contacts-saved-row-${contact.contactId}`}
    >
      <ListItemLeading>
        <ContactAvatar
          contactId={contact.contactId}
          name={contact.name}
          size="md"
          ariaHidden
          testId={`contacts-saved-avatar-${contact.contactId}`}
        />
        <ListItemContent>
          <ListItemTitle data-testid={`contacts-saved-contact-${contact.contactId}-name`}>
            {contact.name}
          </ListItemTitle>
          <ListItemDescription
            data-testid={`contacts-saved-contact-${contact.contactId}-address-count`}
          >
            {formatAddressCount(contact.addressCount)}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}
