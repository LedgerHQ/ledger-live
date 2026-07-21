import React, { useCallback, useRef, useState } from "react";
import { SectionList, type LayoutChangeEvent, type SectionListRenderItemInfo } from "react-native";
import { Box, Spinner } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsListItem, ContactsListSection, ContactsPageNativeProps } from "../../types";
import { ContactsListHeader } from "./ContactsListHeader.native";
import { ContactsSearchNoResults } from "./ContactsSearchNoResults.native";
import { ContactsSearchInput } from "./ContactsSearchInput.native";
import { ContactsSavedContactListItem } from "./ContactsSavedContactListItem.native";
import { ContactsSectionIndex } from "./ContactsSectionIndex.native";
import { ContactsSectionHeader } from "./ContactsSectionHeader.native";
import { useContactsSectionIndex } from "../../internals/useContactsSectionIndex.native";

const noContactsListSections: readonly never[] = [];

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
  const listRef = useRef<SectionList<ContactsListItem, ContactsListSection> | null>(null);
  const [listHeight, setListHeight] = useState(0);
  const {
    activeSectionTitle,
    sectionIndexEntries,
    onSelectSection,
    onViewableItemsChanged,
    viewabilityConfig,
  } = useContactsSectionIndex({
    sections: isPopulated ? viewModel.sections : noContactsListSections,
    listRef,
  });
  const renderContact = useCallback(
    ({ item }: SectionListRenderItemInfo<ContactsListItem, ContactsListSection>) => (
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
      onOpenContact={onOpenContact}
      onAddContact={onAddContact}
    />
  );
  const onListLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;

    setListHeight(currentHeight => (currentHeight === nextHeight ? currentHeight : nextHeight));
  }, []);
  const sectionIndexVerticalCenter = listHeight / 2;

  let content: React.JSX.Element;

  if (isPopulated) {
    content = (
      <Box lx={{ flex: 1 }} onLayout={onListLayout}>
        <SectionList
          ref={listRef}
          testID="contacts-list"
          sections={viewModel.sections}
          keyExtractor={contact => contact.contactId}
          renderItem={renderContact}
          renderSectionHeader={({ section }) => <ContactsSectionHeader title={section.title} />}
          ListHeaderComponent={listHeader}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 24,
          }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        />
        {listHeight > 0 ? (
          <ContactsSectionIndex
            sections={sectionIndexEntries}
            activeSectionTitle={activeSectionTitle}
            onSelectSection={onSelectSection}
            verticalCenterOffset={sectionIndexVerticalCenter}
          />
        ) : null}
      </Box>
    );
  } else if (hasNoResults) {
    content = (
      <Box lx={{ flex: 1, paddingHorizontal: "s16", paddingTop: "s8" }}>
        {listHeader}
        <ContactsSearchNoResults message={labels.searchNoResults} />
      </Box>
    );
  } else {
    content = <Box lx={{ paddingHorizontal: "s16", paddingTop: "s8" }}>{listHeader}</Box>;
  }

  return (
    <Box testID="contacts-screen" lx={{ flex: 1, backgroundColor: "base" }}>
      <Box
        testID="contacts-content"
        lx={{ flex: 1, position: "relative" }}
        pointerEvents={isLedgerSyncChecking ? "none" : "auto"}
        importantForAccessibility={isLedgerSyncChecking ? "no-hide-descendants" : "auto"}
        accessibilityElementsHidden={isLedgerSyncChecking}
      >
        <Box testID="contacts-fixed-search-spacer" lx={{ height: "s64" }} />
        {content}
        <Box
          testID="contacts-fixed-search-mask"
          pointerEvents="none"
          lx={{
            position: "absolute",
            top: "s0",
            right: "s0",
            left: "s0",
            zIndex: 1,
            height: "s64",
            backgroundColor: "base",
          }}
        />
        <Box
          testID="contacts-fixed-search"
          lx={{
            position: "absolute",
            top: "s0",
            right: "s0",
            left: "s0",
            zIndex: 2,
            paddingHorizontal: "s16",
            paddingTop: "s8",
            paddingBottom: "s16",
            backgroundColor: "base",
          }}
        >
          <ContactsSearchInput
            placeholder={labels.searchPlaceholder}
            value={searchQuery}
            onSearchQueryChange={onSearchQueryChange}
          />
        </Box>
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
