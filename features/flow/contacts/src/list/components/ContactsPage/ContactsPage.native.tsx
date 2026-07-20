import React, { useCallback } from "react";
import { SectionList, type SectionListRenderItemInfo } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsListItem, ContactsPageProps } from "../..";
import { ContactsListHeader } from "./ContactsListHeader.native";
import { ContactsSavedContactListItem } from "./ContactsSavedContactListItem.native";
import { ContactsSectionHeader } from "./ContactsSectionHeader.native";

export function ContactsPage({
  viewModel,
  labels,
  meAvatarSrc,
  onOpenContact,
  onAddContact,
}: ContactsPageProps): React.JSX.Element {
  const isPopulated = viewModel.displayMode === "populated";
  const renderContact = useCallback(
    ({ item }: SectionListRenderItemInfo<ContactsListItem>) => (
      <ContactsSavedContactListItem
        contact={item}
        addressCountLabel={labels.formatAddressCount(item.addressCount)}
        onOpen={onOpenContact}
      />
    ),
    [labels, onOpenContact],
  );

  const listHeader = (
    <ContactsListHeader
      me={viewModel.me}
      labels={labels}
      meAvatarSrc={meAvatarSrc}
      showAddContact={!isPopulated}
      onOpenContact={onOpenContact}
      onAddContact={onAddContact}
    />
  );

  return (
    <Box testID="contacts-screen" lx={{ flex: 1, backgroundColor: "base" }}>
      {isPopulated ? (
        <Box lx={{ flex: 1 }}>
          <SectionList
            testID="contacts-list"
            sections={viewModel.sections}
            keyExtractor={contact => contact.contactId}
            renderItem={renderContact}
            renderSectionHeader={({ section }) => <ContactsSectionHeader title={section.title} />}
            ListHeaderComponent={listHeader}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 8,
              paddingBottom: 24,
            }}
            showsVerticalScrollIndicator={false}
          />
        </Box>
      ) : (
        <Box lx={{ paddingHorizontal: "s16", paddingTop: "s8" }}>{listHeader}</Box>
      )}
    </Box>
  );
}
