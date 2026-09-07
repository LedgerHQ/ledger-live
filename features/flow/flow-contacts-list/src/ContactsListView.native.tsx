import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  SectionList,
  type LayoutChangeEvent,
  type SectionListData,
  type SectionListRenderItemInfo,
} from "react-native";
import { Box, Spinner } from "@ledgerhq/lumen-ui-rnative";
import type { ContactsListItem, ContactsListSection, ContactsListViewNativeProps } from "./types";
import { createContactsListRowLayouts } from "./utils";
import { ContactsListHeader } from "./components/ListHeader/ContactsListHeader.native";
import { ContactsSearchNoResults } from "./components/ContactsList/Search/ContactsSearchNoResults.native";
import { ContactsSearchInput } from "./components/ContactsList/Search/ContactsSearchInput.native";
import { ContactsSavedContactListItem } from "./components/ContactsList/ListItems/ContactsSavedContactListItem.native";
import { ContactsSectionIndex } from "./components/ContactsList/Section/ContactsSectionIndex.native";
import { ContactsSectionHeader } from "./components/ContactsList/Section/ContactsSectionHeader.native";
import { useContactsSectionIndex } from "./components/ContactsList/Section/useContactsSectionIndex.native";

const noContactsListSections: readonly never[] = [];

export function ContactsListView({
  viewModel,
  labels,
  meAvatarSrc,
  onOpenContact,
  onAddContact,
  isLedgerSyncChecking,
  searchQuery,
  onSearchQueryChange,
  surface = "base",
}: ContactsListViewNativeProps): React.JSX.Element {
  const isPopulated = viewModel.displayMode === "populated";
  const hasNoResults = "status" in viewModel && viewModel.status === "no-results";
  const me = "me" in viewModel ? viewModel.me : undefined;
  const listRef = useRef<SectionList<ContactsListItem, ContactsListSection> | null>(null);
  const [listHeight, setListHeight] = useState(0);
  const [sectionHeaderHeight, setSectionHeaderHeight] = useState(0);
  const [contactRowHeight, setContactRowHeight] = useState(0);
  const sections = isPopulated ? viewModel.sections : noContactsListSections;
  const {
    activeSectionTitle,
    sectionIndexEntries,
    onSelectSection,
    onScrollToIndexFailed,
    onViewableItemsChanged,
    viewabilityConfig,
  } = useContactsSectionIndex({ sections, listRef });
  const onSectionHeaderLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;

    setSectionHeaderHeight(current => (current > 0 ? current : nextHeight));
  }, []);
  const onContactRowLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;

    setContactRowHeight(current => (current > 0 ? current : nextHeight));
  }, []);
  const renderContact = useCallback(
    ({ item }: SectionListRenderItemInfo<ContactsListItem, ContactsListSection>) => (
      <Box onLayout={onContactRowLayout}>
        <ContactsSavedContactListItem
          contact={item}
          addressCountLabel={labels.formatAddressCount(item.addressCount)}
          onOpen={onOpenContact}
        />
      </Box>
    ),
    [labels, onContactRowLayout, onOpenContact],
  );
  const rowLayouts = useMemo(
    () => createContactsListRowLayouts(sections, sectionHeaderHeight, contactRowHeight),
    [contactRowHeight, sectionHeaderHeight, sections],
  );
  // Until the first header and row report their height the table would be all zeros, which is worse
  // than letting the list measure cells itself.
  const hasMeasuredRows = sectionHeaderHeight > 0 && contactRowHeight > 0;
  const getItemLayout = useMemo(
    () =>
      hasMeasuredRows
        ? (
            _data: SectionListData<ContactsListItem, ContactsListSection>[] | null,
            index: number,
          ) => ({
            length: rowLayouts[index]?.length ?? contactRowHeight,
            offset: rowLayouts[index]?.offset ?? 0,
            index,
          })
        : undefined,
    [contactRowHeight, hasMeasuredRows, rowLayouts],
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
          sections={sections}
          keyExtractor={contact => contact.contactId}
          renderItem={renderContact}
          renderSectionHeader={({ section }) => (
            <Box onLayout={onSectionHeaderLayout}>
              <ContactsSectionHeader title={section.title} surface={surface} />
            </Box>
          )}
          ListHeaderComponent={listHeader}
          getItemLayout={getItemLayout}
          onViewableItemsChanged={onViewableItemsChanged}
          onScrollToIndexFailed={onScrollToIndexFailed}
          viewabilityConfig={viewabilityConfig}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 8,
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
    <Box testID="contacts-screen" lx={{ flex: 1, backgroundColor: surface }}>
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
            backgroundColor: surface,
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
