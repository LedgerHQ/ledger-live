import React from "react";
import { BottomSheetHeader, BottomSheetScrollView, Box } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import type { DepositOptionsViewProps } from "../../types";
import { DepositOptionRow } from "./DepositOptionRow";

export function DepositOptionsView({
  isOpen,
  title,
  options,
  onClose,
  onSelectOption,
}: DepositOptionsViewProps) {
  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      maxDynamicContentSize="fullWithOffset"
      testID="pay-card-deposit-sheet"
    >
      {isOpen ? (
        <>
          <BottomSheetHeader spacing density="expanded" title={title} />
          <BottomSheetScrollView>
            <Box
              lx={{ flexDirection: "column", gap: "s8", paddingBottom: "s16" }}
              testID="pay-card-deposit-options"
            >
              {options.map(option => (
                <DepositOptionRow key={option.id} option={option} onSelect={onSelectOption} />
              ))}
            </Box>
          </BottomSheetScrollView>
        </>
      ) : null}
    </QueuedBottomSheet>
  );
}
