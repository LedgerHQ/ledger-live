import React, { useCallback, useRef, useState } from "react";
import type { TextInput } from "react-native";
import {
  BottomSheetHeader,
  BottomSheetScrollView,
  SelectList,
  SelectListContent,
  SelectListEmptyState,
  SelectListItem,
  SelectListItemContent,
  SelectListItemDescription,
  SelectListItemText,
  SelectListSearch,
} from "@ledgerhq/lumen-ui-rnative";
import { matchesSettingsOption } from "@features/flow-settings";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { useBottomSheetKeyboardAwareInput } from "@shared/ui-queued-bottom-sheet/keyboard";
import type { GeneralSectionLabels } from "../copy/useGeneralSectionLabels";
import type { GeneralSheet } from "./useGeneralSectionSheetsViewModel";

const CONTENT_BOTTOM_SPACING = 24;

type GeneralChoiceSheetProps = Readonly<{
  sheet: GeneralSheet | null;
  search: GeneralSectionLabels["search"];
  onClose: () => void;
}>;

function GeneralChoiceSheetContent({
  sheet,
  search,
  onClose,
}: Readonly<{ sheet: GeneralSheet } & Omit<GeneralChoiceSheetProps, "sheet">>) {
  const bottomInset = useBottomSheetBottomInset();
  const searchRef = useRef<TextInput>(null);
  const keyboardAwareSearchProps = useBottomSheetKeyboardAwareInput(searchRef);

  return (
    <BottomSheetScrollView
      contentContainerStyle={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <BottomSheetHeader density="expanded" title={sheet.title} />
      <SelectList
        items={[...sheet.options]}
        value={sheet.value}
        onValueChange={selected => {
          onClose();
          if (selected !== null && selected !== sheet.value) sheet.onSelect(selected);
        }}
        filter={matchesSettingsOption}
      >
        {sheet.hasSearch ? (
          <SelectListSearch
            ref={searchRef}
            placeholder={search.placeholder}
            {...keyboardAwareSearchProps}
          />
        ) : null}
        {sheet.hasSearch ? <SelectListEmptyState title={search.emptyLabel} /> : null}
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

/** The sheet of the General row being edited: its options, searchable when the list is long. */
export function GeneralChoiceSheet({ sheet, search, onClose }: GeneralChoiceSheetProps) {
  // The sheet reports its close when the closing animation starts: keep the content until hidden.
  const [shownSheet, setShownSheet] = useState(sheet);
  if (sheet !== null && sheet !== shownSheet) setShownSheet(sheet);
  const onModalHide = useCallback(() => {
    if (sheet === null) setShownSheet(null);
  }, [sheet]);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={sheet !== null}
      onClose={onClose}
      onModalHide={onModalHide}
      enableDynamicSizing
      contentHasBottomSpace
      testID="settings-general-sheet"
    >
      {shownSheet ? (
        <GeneralChoiceSheetContent sheet={shownSheet} search={search} onClose={onClose} />
      ) : null}
    </QueuedBottomSheet>
  );
}
