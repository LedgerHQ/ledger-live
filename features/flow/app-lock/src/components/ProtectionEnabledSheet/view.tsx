import { biometricsTypeKey } from "@features/platform-app-lock";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import { InfoState } from "@shared/ui-info-state/native";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import React from "react";
import type { ProtectionEnabledSheetProps } from "./types";

export function ProtectionEnabledSheet({
  isOpen,
  variant,
  biometricsKind,
  reason,
  bottomInset = 0,
  onContinue,
  onClose,
}: ProtectionEnabledSheetProps): React.JSX.Element {
  const { t } = useTranslation();

  const biometricsType = biometricsKind
    ? t(biometricsTypeKey(biometricsKind), { defaultValue: biometricsKind })
    : "";

  const title =
    variant === "biometrics"
      ? t("appLock.protectionEnabled.biometrics.title", { biometricsType })
      : t("appLock.protectionEnabled.password.title");

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      enableDynamicSizing
      testID="app-lock-protection-enabled-sheet"
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        {isOpen ? (
          <>
            <BottomSheetHeader density="compact" />
            <InfoState
              size="hug"
              preset="success"
              title={title}
              description={reason ?? t("appLock.protectionEnabled.description")}
              primaryCta={{
                label: t("appLock.protectionEnabled.cta"),
                onPress: onContinue,
                testID: "app-lock-protection-enabled-continue",
              }}
              testID="app-lock-protection-enabled-content"
            />
          </>
        ) : null}
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
