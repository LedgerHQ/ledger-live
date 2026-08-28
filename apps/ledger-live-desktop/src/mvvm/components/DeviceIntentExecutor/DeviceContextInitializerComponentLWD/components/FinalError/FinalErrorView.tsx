import React from "react";
import { useTranslation } from "react-i18next";
import type { DmkError } from "@ledgerhq/live-dmk-desktop";
import { InfoState } from "@shared/ui-info-state";
import TranslatedError from "~/renderer/components/TranslatedError";

type FinalErrorViewProps = Readonly<{
  error: Error | DmkError;
  isInvalidProvider: boolean;
  onCancel: () => void;
  onContactSupport: () => void;
  onGoToSettings: () => void;
}>;

export function FinalErrorView({
  error,
  isInvalidProvider,
  onCancel,
  onContactSupport,
  onGoToSettings,
}: FinalErrorViewProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="error"
      size="hug"
      title={<TranslatedError error={error} field="title" />}
      description={<TranslatedError error={error} field="description" />}
      primaryCta={
        isInvalidProvider
          ? {
              label: t("errors.InvalidGetFirmwareMetadataResponseError.goToSettingsCTA"),
              onPress: onGoToSettings,
            }
          : {
              label: t("deviceIntentExecutor.initialization.cta.contactLedgerSupport"),
              onPress: onContactSupport,
            }
      }
      secondaryCta={{
        label: t("common.close"),
        onPress: onCancel,
      }}
      testID="device-initializer-final-error"
    />
  );
}
