import React from "react";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";

type UnsupportedApplicationViewProps = Readonly<{
  onContactSupport: () => void;
}>;

export function UnsupportedApplicationView({ onContactSupport }: UnsupportedApplicationViewProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={
        <Trans i18nKey="deviceIntentExecutor.initialization.blocking.unsupportedApplication.title" />
      }
      description={
        <Trans i18nKey="deviceIntentExecutor.initialization.blocking.unsupportedApplication.description" />
      }
      primaryCta={{
        label: <Trans i18nKey="deviceIntentExecutor.initialization.cta.contactLedgerSupport" />,
        onPress: onContactSupport,
      }}
      testID="device-initializer-unsupported-application"
    />
  );
}
