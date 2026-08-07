import React from "react";
import { useTranslation } from "react-i18next";
import { InfoState } from "LLD/components/InfoState";

type WrongDeviceForAccountViewProps = Readonly<{
  onCancel: () => void;
  onContactSupport: () => void;
}>;

export function WrongDeviceForAccountView({
  onCancel,
  onContactSupport,
}: WrongDeviceForAccountViewProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t("deviceIntentExecutor.initialization.blocking.wrongDeviceForAccount.title")}
      description={t(
        "deviceIntentExecutor.initialization.blocking.wrongDeviceForAccount.description",
      )}
      primaryCta={{
        label: t("common.close"),
        onPress: onCancel,
      }}
      secondaryCta={{
        label: t("deviceIntentExecutor.initialization.cta.contactLedgerSupport"),
        onPress: onContactSupport,
      }}
      testID="device-initializer-wrong-device-for-account"
    />
  );
}
