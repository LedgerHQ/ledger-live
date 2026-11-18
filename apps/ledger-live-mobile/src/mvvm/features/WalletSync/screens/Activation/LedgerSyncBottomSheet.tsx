import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BackHandler, View } from "react-native";
import { BottomSheetHeader, BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { useSelector } from "~/context/hooks";
import { isModalLockedSelector } from "~/reducers/appstate";

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
  // Back closes the sheet like its close button: the sheet then reports it once through `onClose`.
  const [isClosedByBack, setIsClosedByBack] = useState(false);
  if (!isOpen && isClosedByBack) setIsClosedByBack(false);
  const isRequestingToBeOpened = isOpen && !isClosedByBack;
  const closeSheet = useCallback(() => setIsClosedByBack(true), []);
  useHardwareBackWhileOpen(isRequestingToBeOpened, hasBackButton ? onBack : closeSheet);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isRequestingToBeOpened}
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

/**
 * Lumen's sheet leaves the hardware Back to the screen behind it, which the legacy drawer's modal
 * caught. The listener is added once per opening, so a device step opened later stays on top of it.
 */
function useHardwareBackWhileOpen(isOpen: boolean, onBack: (() => void) | undefined) {
  const isLocked = useSelector(isModalLockedSelector);
  const latestRef = useRef({ isLocked, onBack });
  useLayoutEffect(() => {
    latestRef.current = { isLocked, onBack };
  }, [isLocked, onBack]);

  useEffect(() => {
    if (!isOpen) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      const { isLocked, onBack } = latestRef.current;
      if (!isLocked) onBack?.();
      return true;
    });
    return () => subscription.remove();
  }, [isOpen]);
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
