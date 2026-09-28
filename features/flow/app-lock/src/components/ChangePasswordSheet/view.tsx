import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { Lock } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { InfoState } from "@shared/ui-info-state/native";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import React from "react";
import type { ChangePasswordSheetProps } from "./types";

// Content unguarded by `isOpen`, unlike the sheets their hosts leave mounted: this one is mounted
// only while on screen, and keeping it through the close animation stops the sheet emptying.
export function ChangePasswordSheet({
  isOpen,
  bottomInset = 0,
  onChange,
  onHidden,
}: ChangePasswordSheetProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onModalHide={onHidden}
      noCloseButton
      preventBackdropClick
      enablePanDownToClose={false}
      enableDynamicSizing
      testID="app-lock-change-password-sheet"
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        <BottomSheetHeader density="compact" />
        <InfoState
          size="hug"
          preset="spot"
          spotProps={{ icon: Lock }}
          title={t("appLock.longerPassword.prompt.title")}
          description={t("appLock.longerPassword.prompt.description")}
          primaryCta={{
            label: t("appLock.longerPassword.prompt.cta"),
            onPress: onChange,
            testID: "app-lock-change-password-confirm",
          }}
          testID="app-lock-change-password-content"
        />
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
