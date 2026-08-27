import React from "react";
import { BottomSheetHeader, BottomSheetView, Box } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { DepositOptionsViewProps } from "../../types";
import { DepositOptionRow } from "./DepositOptionRow";

export function DepositOptionsView({
  isOpen,
  title,
  options,
  bottomInset = 0,
  onClose,
  onSelectOption,
}: DepositOptionsViewProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      testID="pay-card-deposit-sheet"
    >
      {isOpen ? (
        <BottomSheetView
          style={{ paddingHorizontal: 0, paddingBottom: bottomInset + 24 }}
          testID="pay-card-deposit-sheet-content"
        >
          <BottomSheetHeader spacing density="expanded" title={title} />

          <Box
            lx={{
              flexDirection: "column",
              gap: "s8",
              marginHorizontal: "s8",
            }}
            testID="pay-card-deposit-options"
          >
            {options.map(option => (
              <DepositOptionRow key={option.id} option={option} onSelect={onSelectOption} />
            ))}
          </Box>
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
}
