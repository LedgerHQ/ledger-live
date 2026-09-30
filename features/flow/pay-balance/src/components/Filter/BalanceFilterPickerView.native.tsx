import React from "react";
import {
  Banner,
  BottomSheetHeader,
  BottomSheetScrollView,
  Box,
  Button,
} from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetFooterInset } from "@shared/ui-queued-bottom-sheet";
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
      enableDynamicSizing
      maxDynamicContentSize="fullWithOffset"
      testID="pay-card-balance-filter-sheet"
      footer={
        isOpen ? (
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
        ) : null
      }
    >
      {isOpen ? (
        <BalanceFilterPickerContent>
          <BottomSheetHeader
            density="expanded"
            title={labels.filterDialogTitle}
            description={labels.filterDialogDescription}
          />
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
        </BalanceFilterPickerContent>
      ) : null}
    </QueuedBottomSheet>
  );
}

/**
 * Everything the sheet has to measure sits in this scrollable, so the sheet hugs it and only
 * scrolls once the options outgrow the screen. The confirm button stays pinned below, and the room
 * it takes is reserved here.
 */
function BalanceFilterPickerContent({ children }: Readonly<{ children: React.ReactNode }>) {
  const footerInset = useBottomSheetFooterInset();

  return (
    <BottomSheetScrollView>
      <Box style={{ paddingBottom: footerInset }}>{children}</Box>
    </BottomSheetScrollView>
  );
}
