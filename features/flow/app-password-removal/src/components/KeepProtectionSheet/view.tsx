import { biometricsTypeKey } from "@features/platform-app-lock";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { InfoState } from "@shared/ui-info-state/native";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import React from "react";
import type { KeepProtectionSheetProps } from "./types";

export function KeepProtectionSheet({
  isOpen,
  protection,
  biometricsKind,
  bottomInset = 0,
  onClose,
}: KeepProtectionSheetProps): React.JSX.Element {
  const { t } = useTranslation();

  const biometricsType = biometricsKind
    ? t(biometricsTypeKey(biometricsKind), { defaultValue: biometricsKind })
    : "";

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      testID="app-lock-keep-protection-sheet"
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        {isOpen ? (
          <>
            <BottomSheetHeader density="compact" />
            <InfoState
              size="hug"
              preset="error"
              title={t(`appLock.keepProtection.${protection}.title`, { biometricsType })}
              description={t(`appLock.keepProtection.${protection}.description`, {
                biometricsType,
              })}
              primaryCta={{
                label: t("appLock.keepProtection.cta"),
                onPress: onClose,
                testID: "app-lock-keep-protection-dismiss",
              }}
              testID="app-lock-keep-protection-content"
            />
          </>
        ) : null}
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
