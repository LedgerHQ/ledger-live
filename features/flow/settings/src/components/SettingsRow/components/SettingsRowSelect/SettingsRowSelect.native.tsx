import React, { useRef } from "react";
import type { TextInput } from "react-native";
import {
  BottomSheetHeader,
  BottomSheetScrollView,
  Pressable,
  SelectList,
  SelectListContent,
  SelectListEmptyState,
  SelectListItem,
  SelectListItemContent,
  SelectListItemDescription,
  SelectListItemText,
  SelectListSearch,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronDown } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { useBottomSheetKeyboardAwareInput } from "@shared/ui-queued-bottom-sheet/keyboard";
import { matchesSettingsOption } from "../../../../logic/settingsOptionSearch";
import type { SettingsRowSearch } from "../../SettingsRow.types";
import type { SettingsRowSelectProps } from "./SettingsRowSelect.types";
import { useSettingsRowSelectSheet } from "./useSettingsRowSelectSheet";

const CONTENT_BOTTOM_SPACING = 24;

type SelectSheetContentProps = Readonly<{
  title: string;
  value: string;
  items: ReturnType<typeof useSettingsRowSelectSheet>["items"];
  search: SettingsRowSearch | undefined;
  onValueChange: (value: string | null) => void;
}>;

function SelectSheetContent({
  title,
  value,
  items,
  search,
  onValueChange,
}: SelectSheetContentProps) {
  const bottomInset = useBottomSheetBottomInset();
  const searchRef = useRef<TextInput>(null);
  const keyboardAwareSearchProps = useBottomSheetKeyboardAwareInput(searchRef);

  return (
    <BottomSheetScrollView
      contentContainerStyle={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <BottomSheetHeader density="expanded" title={title} />
      <SelectList
        items={items}
        value={value}
        onValueChange={onValueChange}
        filter={matchesSettingsOption}
      >
        {search ? (
          <SelectListSearch
            ref={searchRef}
            placeholder={search.placeholder}
            {...keyboardAwareSearchProps}
          />
        ) : null}
        {search ? <SelectListEmptyState title={search.emptyLabel} /> : null}
        <SelectListContent
          renderItem={item => (
            <SelectListItem key={item.value} value={item.value}>
              <SelectListItemContent>
                <SelectListItemText>{item.label}</SelectListItemText>
                {item.description ? (
                  <SelectListItemDescription>{item.description}</SelectListItemDescription>
                ) : null}
              </SelectListItemContent>
            </SelectListItem>
          )}
        />
      </SelectList>
    </BottomSheetScrollView>
  );
}

/** The current value opens a sheet listing the options, like the web select opens its list. */
export function SettingsRowSelect({ trailing, rowTitle, disabled }: SettingsRowSelectProps) {
  const { isOpen, open, close, items, onValueChange, selectedLabel } =
    useSettingsRowSelectSheet(trailing);

  return (
    <>
      <Pressable
        onPress={open}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={rowTitle}
        lx={{ flexDirection: "row", alignItems: "center", gap: "s4" }}
      >
        <Text typography="body2" lx={{ color: "muted" }}>
          {selectedLabel}
        </Text>
        <ChevronDown size={20} color="muted" />
      </Pressable>
      <QueuedBottomSheet
        isRequestingToBeOpened={isOpen}
        onClose={close}
        enableDynamicSizing
        contentHasBottomSpace
      >
        {isOpen ? (
          <SelectSheetContent
            title={rowTitle}
            value={trailing.value}
            items={items}
            search={trailing.search}
            onValueChange={onValueChange}
          />
        ) : null}
      </QueuedBottomSheet>
    </>
  );
}
