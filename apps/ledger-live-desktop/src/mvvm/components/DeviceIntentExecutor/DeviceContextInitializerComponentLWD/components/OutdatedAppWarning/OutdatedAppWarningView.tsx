import React from "react";
import { useTranslation } from "react-i18next";
import { InfoState } from "@shared/ui-info-state";

type OutdatedAppWarningViewProps = Readonly<{
  appName: string;
  onOpenMyLedger: () => void;
  onContinue: () => void;
}>;

export function OutdatedAppWarningView({
  appName,
  onOpenMyLedger,
  onContinue,
}: OutdatedAppWarningViewProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t("deviceIntentExecutor.initialization.outdatedAppWarning.title")}
      description={t("deviceIntentExecutor.initialization.outdatedAppWarning.description", {
        appName,
      })}
      primaryCta={{
        label: t("deviceIntentExecutor.initialization.cta.openMyLedger"),
        onPress: onOpenMyLedger,
      }}
      secondaryCta={{
        label: t("common.continue"),
        onPress: onContinue,
      }}
      testID="device-initializer-outdated-app-warning"
    />
  );
}
