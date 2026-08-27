import React from "react";
import {
  Banner,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetScrollView,
  Box,
  Button,
} from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { BalanceFilterPickerViewProps } from "../../types";
import { BalanceFilterOptionRow } from "./BalanceFilterOptionRow";

export function BalanceFilterPickerView({
  isOpen,
  draftFilter,
  options,
  labels,
  onClose,
  onSelectDraft,
  onConfirm,
}: BalanceFilterPickerViewProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      snapPoints="fullWithOffset"
      testID="pay-card-balance-filter-sheet"
    >
      {isOpen ? (
        <>
          <BottomSheetHeader
            spacing
            density="expanded"
            title={labels.filterDialogTitle}
            description={labels.filterDialogDescription}
          />
          {/* Scrollable asset list: only the options scroll, the footer below stays pinned. */}
          <BottomSheetScrollView>
            <Box
              lx={{ flexDirection: "column", gap: "s8", paddingBottom: "s16" }}
              testID="pay-card-balance-filter-picker"
            >
              {options.map(option => (
                <BalanceFilterOptionRow
                  key={option.id}
                  option={option}
                  selected={option.id === draftFilter}
                  onSelect={onSelectDraft}
                />
              ))}
              <Banner appearance="info" title={labels.filterDialogBanner} />
            </Box>
          </BottomSheetScrollView>
          <BottomSheetFooter lx={{ gap: "s16" }}>
            <Button
              appearance="base"
              size="lg"
              isFull
              onPress={onConfirm}
              accessibilityLabel={labels.confirm}
              testID="pay-card-balance-filter-confirm"
            >
              {labels.confirm}
            </Button>
          </BottomSheetFooter>
        </>
      ) : null}
    </QueuedBottomSheet>
  );
}
