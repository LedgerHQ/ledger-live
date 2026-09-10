import React from "react";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { ContactAvatar } from "@features/platform-contacts";
import type { ContactsCompactListProps, ContactsCompactRowProps } from "../../types";
import {
  getCompactContactAddressDescription,
  getDisplayedCompactContacts,
} from "./utils/ContactsCompactList.utils";
import { useTranslation } from "@shared/i18n";

export function ContactsCompactRow({
  contact,
  onContactSelect,
}: ContactsCompactRowProps): React.JSX.Element {
  const { t } = useTranslation();

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
          <ListItemTitle>{contact.name}</ListItemTitle>
          <ListItemDescription>
            {getCompactContactAddressDescription(
              contact,
              t("contacts.addressCount", { count: 0 }),
              count => t("contacts.addressCount", { count }),
            )}
          </ListItemDescription>
        </ListItemContent>
      </ListItemLeading>
    </ListItem>
  );
}

export function ContactsCompactList({
  contacts,
  maxContacts,
  onContactSelect,
}: ContactsCompactListProps): React.JSX.Element {
  const displayedContacts = getDisplayedCompactContacts(contacts, maxContacts);

  return (
    <>
      {displayedContacts.map(contact => (
        <ContactsCompactRow key={contact.id} contact={contact} onContactSelect={onContactSelect} />
      ))}
    </>
  );
}
