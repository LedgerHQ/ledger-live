import React from "react";
import {
  BottomSheetHeader,
  BottomSheetScrollView,
  Pressable,
  SelectList,
  SelectListContent,
  SelectListItem,
  SelectListItemContent,
  SelectListItemText,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { ChevronDown } from "@ledgerhq/lumen-ui-rnative/symbols";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import type { SettingsRowSelectProps } from "./SettingsRowSelect.types";
import { useSettingsRowSelectSheet } from "./useSettingsRowSelectSheet";

const CONTENT_BOTTOM_SPACING = 24;

type SelectSheetContentProps = Readonly<{
  title: string;
  value: string;
  items: ReturnType<typeof useSettingsRowSelectSheet>["items"];
  onValueChange: (value: string | null) => void;
}>;

function SelectSheetContent({ title, value, items, onValueChange }: SelectSheetContentProps) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetScrollView
      contentContainerStyle={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}
      showsVerticalScrollIndicator={false}
    >
      <BottomSheetHeader density="expanded" title={title} />
      <SelectList items={items} value={value} onValueChange={onValueChange}>
        <SelectListContent
          renderItem={item => (
            <SelectListItem key={item.value} value={item.value}>
              <SelectListItemContent>
                <SelectListItemText>{item.label}</SelectListItemText>
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
            onValueChange={onValueChange}
          />
        ) : null}
      </QueuedBottomSheet>
    </>
  );
}
