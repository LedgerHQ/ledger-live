import React from "react";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsListItem, ContactsListViewLabels } from "../../types";
import { ContactsAddContactListItem } from "../ContactsList/ListItems/ContactsAddContactListItem.native";
import { ContactsMeListItem } from "../ContactsList/ListItems/ContactsMeListItem.native";

type ContactsListHeaderProps = Readonly<{
  me?: ContactsListItem;
  labels: ContactsListViewLabels;
  meAvatarSrc: string;
  showAddContact: boolean;
  onOpenContact: (contactId: ContactsListItem["contactId"]) => void;
  onAddContact: () => void;
}>;

export function ContactsListHeader({
  me,
  labels,
  meAvatarSrc,
  showAddContact,
  onOpenContact,
  onAddContact,
}: ContactsListHeaderProps): React.JSX.Element {
  return (
    <Box testID="contacts-list-header" lx={{ gap: "s8" }}>
      {me ? (
        <ContactsMeListItem
          contact={me}
          avatarSrc={meAvatarSrc}
          addressCountLabel={labels.formatAddressCount(me.addressCount)}
          onOpen={onOpenContact}
        />
      ) : null}
      {showAddContact ? (
        <ContactsAddContactListItem label={labels.addContact} onPress={onAddContact} />
      ) : null}
    </Box>
  );
}
