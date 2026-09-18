import { biometricsTypeKey } from "@features/platform-app-lock";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { Lock } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import { InfoState } from "@shared/ui-info-state/native";
import { QueuedBottomSheet, useBottomSheetBackgroundTone } from "@shared/ui-queued-bottom-sheet";
import React from "react";
import type { EnableProtectionSheetProps } from "./types";

export function EnableProtectionSheet({
  isOpen,
  variant,
  biometricsKind,
  reason,
  bottomInset = 0,
  onConfirm,
  onClose,
  onHidden,
}: EnableProtectionSheetProps): React.JSX.Element {
  const { t } = useTranslation();
  useBottomSheetBackgroundTone("info");

  const isBiometrics = variant === "biometrics";
  const biometricsType = biometricsKind
    ? t(biometricsTypeKey(biometricsKind), { defaultValue: biometricsKind })
    : "";

  const title = isBiometrics
    ? t("appLock.enableProtection.biometrics.title", { biometricsType })
    : t("appLock.enableProtection.password.title");

  const description = isBiometrics
    ? t("appLock.enableProtection.biometrics.description", { biometricsType })
    : t("appLock.enableProtection.password.description");

  const cta = isBiometrics
    ? t("appLock.enableProtection.biometrics.cta", { biometricsType })
    : t("appLock.enableProtection.password.cta");

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      onModalHide={onHidden}
      enableDynamicSizing
      testID="app-lock-enable-protection-sheet"
    >
      <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
        {isOpen ? (
          <>
            <BottomSheetHeader density="compact" />
            <InfoState
              size="hug"
              preset="spot"
              spotProps={{ icon: Lock }}
              title={title}
              description={reason ?? description}
              primaryCta={{
                label: cta,
                onPress: onConfirm,
                testID: "app-lock-enable-protection-confirm",
              }}
              testID="app-lock-enable-protection-content"
            />
          </>
        ) : null}
      </BottomSheetView>
    </QueuedBottomSheet>
  );
}
