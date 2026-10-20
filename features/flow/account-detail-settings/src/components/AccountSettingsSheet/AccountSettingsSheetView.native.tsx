import React, { type ReactNode } from "react";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { QueuedBottomSheet, useBottomSheetBottomInset } from "@shared/ui-queued-bottom-sheet";
import { AccountSettingsMenu } from "../AccountSettingsMenu";
import { RemoveAccountContent } from "../RemoveAccountContent";
import type { AccountSettingsSheetViewProps } from "./types.native";

const CONTENT_BOTTOM_SPACING = 24;

function SheetContent({ children }: Readonly<{ children: ReactNode }>) {
  const bottomInset = useBottomSheetBottomInset();

  return (
    <BottomSheetView style={{ paddingBottom: bottomInset + CONTENT_BOTTOM_SPACING }}>
      {children}
    </BottomSheetView>
  );
}

export function AccountSettingsSheetView({
  isOpen,
  accountName,
  step,
  title,
  onClose,
  onChangeName,
  onViewAdvancedLogs,
  onConfirmRemove,
  onShowMenu,
  onShowRemove,
  onHidden,
  testID,
}: AccountSettingsSheetViewProps) {
  const onModalHide = () => {
    onShowMenu();
    onHidden?.();
  };

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      onModalHide={onModalHide}
      hasBackButton={step === "remove"}
      onBack={onShowMenu}
      enableDynamicSizing
      contentHasBottomSpace
      testID={testID}
    >
      <SheetContent>
        {step === "menu" ? (
          <>
            <BottomSheetHeader density="expanded" title={title} />
            <AccountSettingsMenu
              accountName={accountName}
              onChangeName={onChangeName}
              onViewAdvancedLogs={onViewAdvancedLogs}
              onRemoveAccount={onShowRemove}
            />
          </>
        ) : (
          <>
            <BottomSheetHeader density="compact" />
            <RemoveAccountContent onConfirm={onConfirmRemove} onCancel={onClose} />
          </>
        )}
      </SheetContent>
    </QueuedBottomSheet>
  );
}
