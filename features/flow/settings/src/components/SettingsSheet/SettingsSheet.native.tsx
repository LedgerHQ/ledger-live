import React, { useCallback, useState } from "react";
import { BottomSheetHeader, BottomSheetScrollView, Box } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import type { SettingsSheetProps } from "./SettingsSheet.types";

const CONTENT_BOTTOM_SPACING = 24;

function SettingsSheetContent({
  title,
  description,
  children,
  testID,
}: Pick<SettingsSheetProps, "title" | "description" | "children" | "testID">) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetScrollView
      contentContainerStyle={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}
      showsVerticalScrollIndicator={false}
    >
      <BottomSheetHeader
        density="expanded"
        title={title}
        description={description}
        testID={testID && `${testID}-header`}
      />
      <Box lx={{ gap: "s24" }}>{children}</Box>
    </BottomSheetScrollView>
  );
}

export function SettingsSheet({
  isOpen,
  title,
  description,
  onClose,
  canClose = true,
  children,
  testID,
}: SettingsSheetProps) {
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
        <SettingsSheetContent title={title} description={description} testID={testID}>
          {children}
        </SettingsSheetContent>
      ) : null}
    </QueuedBottomSheet>
  );
}
