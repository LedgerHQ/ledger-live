import React from "react";
import { Box, SearchInput } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsPageProps } from "../..";
import { ContactsAddContactListItem } from "./ContactsAddContactListItem.native";
import { ContactsMeListItem } from "./ContactsMeListItem.native";

export function ContactsPage({
  viewModel,
  labels,
  meAvatarSrc,
  onOpenMe,
  onAddContact,
}: Readonly<ContactsPageProps>): React.JSX.Element {
  return (
    <Box testID="contacts-screen" lx={{ flex: 1, backgroundColor: "base" }}>
      <Box lx={{ gap: "s8", paddingHorizontal: "s16", paddingTop: "s8" }}>
        <SearchInput
          testID="contacts-search-input"
          value=""
          editable={false}
          placeholder={labels.searchPlaceholder}
          accessibilityLabel={labels.searchPlaceholder}
        />
        <ContactsMeListItem
          contact={viewModel.me}
          avatarSrc={meAvatarSrc}
          addressCountLabel={labels.formatAddressCount(viewModel.me.addressCount)}
          onOpen={onOpenMe}
        />
        <ContactsAddContactListItem label={labels.addContact} onPress={onAddContact} />
      </Box>
    </Box>
  );
}
