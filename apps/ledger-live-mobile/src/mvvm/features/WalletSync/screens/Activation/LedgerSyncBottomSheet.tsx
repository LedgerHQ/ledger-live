import React from "react";
import { View } from "react-native";
import { BottomSheetHeader, BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";

type Props = Readonly<{
  isOpen: boolean;
  onClose?: () => void;
  hasBackButton?: boolean;
  onBack?: () => void;
  /** Replaces the sheet header and its close button. */
  customHeader?: React.ReactNode;
  testID: string;
  children: React.ReactNode;
}>;

/**
 * A Ledger Sync drawer on the Lumen sheet. A device step that follows it hands off from sheet to
 * sheet, which a legacy drawer's own Android window does not allow without losing the first tap.
 */
export function LedgerSyncBottomSheet({
  isOpen,
  onClose,
  hasBackButton,
  onBack,
  customHeader,
  testID,
  children,
}: Props) {
  const hasCustomHeader = customHeader !== undefined;

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      hasBackButton={hasBackButton}
      onBack={onBack}
      noCloseButton={hasCustomHeader}
      enableDynamicSizing
      contentHasBottomSpace
      testID={testID}
    >
      <LedgerSyncBottomSheetContent
        header={hasCustomHeader ? customHeader : <BottomSheetHeader />}
        testID={`${testID}-content`}
      >
        {children}
      </LedgerSyncBottomSheetContent>
    </QueuedBottomSheet>
  );
}

function LedgerSyncBottomSheetContent({
  header,
  testID,
  children,
}: Readonly<{ header: React.ReactNode; testID: string; children: React.ReactNode }>) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      testID={testID}
    >
      {header}
      <View style={{ paddingBottom: bottomInset }}>{children}</View>
    </BottomSheetScrollView>
  );
}
