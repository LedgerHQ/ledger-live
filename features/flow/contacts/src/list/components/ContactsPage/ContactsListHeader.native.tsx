import React from "react";
import { Box, SearchInput } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsListItem, ContactsPageLabels } from "../..";
import { ContactsAddContactListItem } from "./ContactsAddContactListItem.native";
import { ContactsMeListItem } from "./ContactsMeListItem.native";

type ContactsListHeaderProps = Readonly<{
  me: ContactsListItem;
  labels: ContactsPageLabels;
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
    <Box lx={{ gap: "s8" }}>
      <SearchInput
        testID="contacts-search-input"
        value=""
        editable={false}
        placeholder={labels.searchPlaceholder}
        accessibilityLabel={labels.searchPlaceholder}
      />
      <ContactsMeListItem
        contact={me}
        avatarSrc={meAvatarSrc}
        addressCountLabel={labels.formatAddressCount(me.addressCount)}
        onOpen={onOpenContact}
      />
      {showAddContact ? (
        <ContactsAddContactListItem label={labels.addContact} onPress={onAddContact} />
      ) : null}
    </Box>
  );
}
