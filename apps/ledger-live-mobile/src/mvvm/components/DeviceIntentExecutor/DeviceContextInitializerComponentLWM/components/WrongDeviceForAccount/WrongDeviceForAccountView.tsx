import React from "react";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";

type WrongDeviceForAccountViewProps = Readonly<{
  onCancel: () => void;
  onContactSupport: () => void;
}>;

export function WrongDeviceForAccountView({
  onCancel,
  onContactSupport,
}: WrongDeviceForAccountViewProps) {
  return (
    <InfoState
      preset="info"
      size="hug"
      title={
        <Trans i18nKey="deviceIntentExecutor.initialization.blocking.wrongDeviceForAccount.title" />
      }
      description={
        <Trans i18nKey="deviceIntentExecutor.initialization.blocking.wrongDeviceForAccount.description" />
      }
      primaryCta={{
        label: <Trans i18nKey="common.close" />,
        onPress: onCancel,
      }}
      secondaryCta={{
        label: <Trans i18nKey="deviceIntentExecutor.initialization.cta.contactLedgerSupport" />,
        onPress: onContactSupport,
      }}
      testID="device-initializer-wrong-device-for-account"
    />
  );
}
