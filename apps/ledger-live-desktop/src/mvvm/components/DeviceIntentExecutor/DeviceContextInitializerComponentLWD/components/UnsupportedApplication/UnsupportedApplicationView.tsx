import React from "react";
import { useTranslation } from "react-i18next";
import { InfoState } from "LLD/components/InfoState";

type UnsupportedApplicationViewProps = Readonly<{
  onContactSupport: () => void;
}>;

export function UnsupportedApplicationView({ onContactSupport }: UnsupportedApplicationViewProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t("deviceIntentExecutor.initialization.blocking.unsupportedApplication.title")}
      description={t(
        "deviceIntentExecutor.initialization.blocking.unsupportedApplication.description",
      )}
      primaryCta={{
        label: t("deviceIntentExecutor.initialization.cta.contactLedgerSupport"),
        onPress: onContactSupport,
      }}
      testID="device-initializer-unsupported-application"
    />
  );
}
