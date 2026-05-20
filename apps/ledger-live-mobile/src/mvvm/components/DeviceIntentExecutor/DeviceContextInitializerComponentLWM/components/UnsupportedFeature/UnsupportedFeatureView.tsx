import React from "react";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";

type UnsupportedFeatureViewProps = Readonly<{
  onContactSupport: () => void;
}>;

export function UnsupportedFeatureView({ onContactSupport }: UnsupportedFeatureViewProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={
        <Trans i18nKey="deviceIntentExecutor.initialization.blocking.unsupportedFeature.title" />
      }
      description={
        <Trans i18nKey="deviceIntentExecutor.initialization.blocking.unsupportedFeature.description" />
      }
      primaryCta={{
        label: <Trans i18nKey="deviceIntentExecutor.initialization.cta.contactLedgerSupport" />,
        onPress: onContactSupport,
      }}
      testID="device-initializer-unsupported-feature"
    />
  );
}
