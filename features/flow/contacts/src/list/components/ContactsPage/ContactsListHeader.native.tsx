import React from "react";
import { Box, SearchInput } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsListItem } from "../../types";
import type { ContactsPageNativeLabels } from "../../types.native";
import { ContactsAddContactListItem } from "./ContactsAddContactListItem.native";
import { ContactsMeListItem } from "./ContactsMeListItem.native";

type ContactsListHeaderProps = Readonly<{
  me?: ContactsListItem;
  labels: ContactsPageNativeLabels;
  meAvatarSrc: string;
  showAddContact: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onOpenContact: (contactId: ContactsListItem["contactId"]) => void;
  onAddContact: () => void;
}>;

export function ContactsListHeader({
  me,
  labels,
  meAvatarSrc,
  showAddContact,
  searchQuery,
  onSearchQueryChange,
  onOpenContact,
  onAddContact,
}: ContactsListHeaderProps): React.JSX.Element {
  return (
    <Box lx={{ gap: "s8" }}>
      <SearchInput
        testID="contacts-search-input"
        value={searchQuery}
        onChangeText={onSearchQueryChange}
        onClear={() => onSearchQueryChange("")}
        hideClearButton={false}
        placeholder={labels.searchPlaceholder}
        accessibilityLabel={labels.searchPlaceholder}
        autoCorrect={false}
        autoCapitalize="none"
      />
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
