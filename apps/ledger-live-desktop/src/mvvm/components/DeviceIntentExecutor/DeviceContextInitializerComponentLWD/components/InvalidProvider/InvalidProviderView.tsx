import React from "react";
import { useTranslation } from "react-i18next";
import { InfoState } from "@shared/ui-info-state";

type InvalidProviderViewProps = Readonly<{
  onGoToSettings: () => void;
}>;

export function InvalidProviderView({ onGoToSettings }: InvalidProviderViewProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="error"
      size="hug"
      title={t("deviceIntentExecutor.initialization.blocking.invalidProvider.title")}
      description={t("deviceIntentExecutor.initialization.blocking.invalidProvider.description")}
      primaryCta={{
        label: t("deviceIntentExecutor.initialization.cta.goToSettings"),
        onPress: onGoToSettings,
      }}
      testID="device-initializer-invalid-provider"
    />
  );
}
