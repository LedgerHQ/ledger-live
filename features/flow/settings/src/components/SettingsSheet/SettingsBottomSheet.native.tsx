import React, { useCallback, useState, type ReactNode } from "react";
import { BottomSheetScrollView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import type { SettingsSheetProps } from "./SettingsSheet.types";

const CONTENT_BOTTOM_SPACING = 24;

type SettingsBottomSheetProps = Pick<
  SettingsSheetProps,
  "isOpen" | "onClose" | "canClose" | "testID"
> &
  Readonly<{ children: ReactNode }>;

function SettingsBottomSheetContent({ children }: Readonly<{ children: ReactNode }>) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetScrollView
      contentContainerStyle={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </BottomSheetScrollView>
  );
}

/** The queued bottom sheet of the Settings sheets, whatever their content. */
export function SettingsBottomSheet({
  isOpen,
  onClose,
  canClose = true,
  children,
  testID,
}: SettingsBottomSheetProps) {
  // The sheet reports its close when the closing animation starts: keep the content until hidden.
  const [isContentShown, setIsContentShown] = useState(isOpen);
  if (isOpen && !isContentShown) setIsContentShown(true);
  const onModalHide = useCallback(() => {
    if (!isOpen) setIsContentShown(false);
  }, [isOpen]);
  const canUserClose = isOpen && canClose;

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={canUserClose ? onClose : undefined}
      onModalHide={onModalHide}
      noCloseButton={!canClose}
      preventBackdropClick={!canClose}
      enablePanDownToClose={canClose}
      enableDynamicSizing
      contentHasBottomSpace
      testID={testID}
    >
      {isOpen || isContentShown ? (
        <SettingsBottomSheetContent>{children}</SettingsBottomSheetContent>
      ) : null}
    </QueuedBottomSheet>
  );
}
