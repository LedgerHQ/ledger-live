import React from "react";
import { useTranslation } from "react-i18next";
import { InfoState } from "LLD/components/InfoState";

type DeviceNotOnboardedViewProps = Readonly<{
  productName: string;
  onSetupDevice: () => void;
}>;

export function DeviceNotOnboardedView({
  productName,
  onSetupDevice,
}: DeviceNotOnboardedViewProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t("deviceIntentExecutor.initialization.blocking.deviceNotOnboarded.title")}
      description={t(
        "deviceIntentExecutor.initialization.blocking.deviceNotOnboarded.description",
        {
          productName,
        },
      )}
      primaryCta={{
        label: t("deviceIntentExecutor.initialization.cta.setupDevice"),
        onPress: onSetupDevice,
      }}
      testID="device-initializer-device-not-onboarded"
    />
  );
}
