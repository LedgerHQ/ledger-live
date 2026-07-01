import React from "react";
import { useTranslation } from "react-i18next";
import { InfoState } from "LLD/components/InfoState";

type UnsupportedFeatureViewProps = Readonly<{
  onContactSupport: () => void;
}>;

export function UnsupportedFeatureView({ onContactSupport }: UnsupportedFeatureViewProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t("deviceIntentExecutor.initialization.blocking.unsupportedFeature.title")}
      description={t("deviceIntentExecutor.initialization.blocking.unsupportedFeature.description")}
      primaryCta={{
        label: t("deviceIntentExecutor.initialization.cta.contactLedgerSupport"),
        onPress: onContactSupport,
      }}
      testID="device-initializer-unsupported-feature"
    />
  );
}
