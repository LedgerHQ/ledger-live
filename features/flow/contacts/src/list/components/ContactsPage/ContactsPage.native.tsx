import React, { useCallback } from "react";
import { SectionList, type SectionListRenderItemInfo } from "react-native";
import { Box, Spinner } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsListItem } from "../../types";
import type { ContactsPageNativeProps } from "../../types.native";
import { ContactsListHeader } from "./ContactsListHeader.native";
import { ContactsSearchNoResults } from "./ContactsSearchNoResults.native";
import { ContactsSavedContactListItem } from "./ContactsSavedContactListItem.native";
import { ContactsSectionHeader } from "./ContactsSectionHeader.native";

export function ContactsPage({
  viewModel,
  labels,
  meAvatarSrc,
  onOpenContact,
  onAddContact,
  ledgerSyncStatus,
  searchQuery,
  onSearchQueryChange,
}: ContactsPageNativeProps): React.JSX.Element {
  const isPopulated = viewModel.displayMode === "populated";
  const hasNoResults = "status" in viewModel && viewModel.status === "no-results";
  const isLedgerSyncChecking = ledgerSyncStatus === "checking";
  const me = "me" in viewModel ? viewModel.me : undefined;
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
      me={me}
      labels={labels}
      meAvatarSrc={meAvatarSrc}
      showAddContact={!isPopulated && !hasNoResults}
      searchQuery={searchQuery}
      onSearchQueryChange={onSearchQueryChange}
      onOpenContact={onOpenContact}
      onAddContact={onAddContact}
    />
  );

  return (
    <Box testID="contacts-screen" lx={{ flex: 1, backgroundColor: "base" }}>
      <Box
        testID="contacts-content"
        lx={{ flex: 1 }}
        pointerEvents={isLedgerSyncChecking ? "none" : "auto"}
        importantForAccessibility={isLedgerSyncChecking ? "no-hide-descendants" : "auto"}
        accessibilityElementsHidden={isLedgerSyncChecking}
      >
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
              keyboardDismissMode="on-drag"
              keyboardShouldPersistTaps="handled"
            />
          </Box>
        ) : hasNoResults ? (
          <Box lx={{ flex: 1, paddingHorizontal: "s16", paddingTop: "s8" }}>
            {listHeader}
            <ContactsSearchNoResults message={labels.searchNoResults} />
          </Box>
        ) : (
          <Box lx={{ paddingHorizontal: "s16", paddingTop: "s8" }}>{listHeader}</Box>
        )}
      </Box>
      {isLedgerSyncChecking ? (
        <Box
          testID="contacts-ledger-sync-loading"
          lx={{
            position: "absolute",
            top: "s0",
            right: "s0",
            bottom: "s0",
            left: "s0",
            alignItems: "center",
            justifyContent: "center",
          }}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={labels.ledgerSyncCheckingAccessibilityLabel ?? labels.title}
          accessibilityState={{ busy: true }}
        >
          <Spinner testID="contacts-ledger-sync-spinner" />
        </Box>
      ) : null}
    </Box>
  );
}
