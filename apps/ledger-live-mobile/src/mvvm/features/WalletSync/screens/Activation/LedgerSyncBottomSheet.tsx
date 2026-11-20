import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BackHandler, View } from "react-native";
import { BottomSheetHeader, BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { useSelector } from "~/context/hooks";
import { isModalLockedSelector } from "~/reducers/appstate";

// The side padding Lumen's scrollable puts around a sheet's content.
const SHEET_SIDE_MARGIN = 16;

type Props = Readonly<{
  isOpen: boolean;
  onClose?: () => void;
  hasBackButton?: boolean;
  onBack?: () => void;
  title?: string;
  /** Off for content holding a scroll area of its own, so the sheet's drag does not take its scroll. */
  enableContentPanningGesture?: boolean;
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
  title,
  enableContentPanningGesture,
  testID,
  children,
}: Props) {
  // Back closes the sheet like its close button, even on a step with a back button, as the legacy
  // drawer's modal did: the sheet then reports it once through `onClose`.
  const [isClosedByBack, setIsClosedByBack] = useState(false);
  if (!isOpen && isClosedByBack) setIsClosedByBack(false);
  const isRequestingToBeOpened = isOpen && !isClosedByBack;
  const closeSheet = useCallback(() => setIsClosedByBack(true), []);
  useHardwareBackWhileOpen(isRequestingToBeOpened, closeSheet);

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isRequestingToBeOpened}
      onClose={onClose}
      hasBackButton={hasBackButton}
      onBack={onBack}
      enableDynamicSizing
      enableContentPanningGesture={enableContentPanningGesture}
      contentHasBottomSpace
      testID={testID}
    >
      <LedgerSyncBottomSheetContent title={title} testID={`${testID}-content`}>
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
  title,
  testID,
  children,
}: Readonly<{ title?: string; testID: string; children: React.ReactNode }>) {
  const bottomInset = useBottomSheetBottomInset();

  // The side margin goes on the content, not the scroll view, so the sticky header spans the sheet
  // width and its background hides the content scrolled under it.
  return (
    <BottomSheetScrollView
      style={{ paddingHorizontal: 0 }}
      stickyHeaderIndices={[0]}
      alwaysBounceVertical={false}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      testID={testID}
    >
      <BottomSheetHeader spacing title={title} lx={{ backgroundColor: "canvasSheet" }} />
      <View
        style={{ paddingHorizontal: SHEET_SIDE_MARGIN, paddingBottom: bottomInset }}
        testID={`${testID}-body`}
      >
        {children}
      </View>
    </BottomSheetScrollView>
  );
}
