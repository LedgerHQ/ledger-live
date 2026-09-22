import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { InfoState } from "@shared/ui-info-state/native";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import React from "react";
import type { PasswordChangedSheetProps } from "./types";

export function PasswordChangedSheet({
  isOpen,
  bottomInset = 0,
  onDone,
}: PasswordChangedSheetProps): React.JSX.Element {
  const { t } = useTranslation();

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onDone}
      enableDynamicSizing
      testID="app-lock-password-changed-sheet"
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        {isOpen ? (
          <>
            <BottomSheetHeader density="compact" />
            <InfoState
              size="hug"
              preset="success"
              title={t("appLock.longerPassword.changed.title")}
              primaryCta={{
                label: t("appLock.longerPassword.changed.cta"),
                onPress: onDone,
                testID: "app-lock-password-changed-done",
              }}
              testID="app-lock-password-changed-content"
            />
          </>
        ) : null}
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
