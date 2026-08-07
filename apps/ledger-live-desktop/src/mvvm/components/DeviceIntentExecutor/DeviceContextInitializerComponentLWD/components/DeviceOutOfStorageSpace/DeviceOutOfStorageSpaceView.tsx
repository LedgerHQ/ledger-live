import React from "react";
import { useTranslation } from "react-i18next";
import { InfoState } from "LLD/components/InfoState";

type DeviceOutOfStorageSpaceViewProps = Readonly<{
  appNamesText: string;
  onOpenMyLedger: () => void;
}>;

export function DeviceOutOfStorageSpaceView({
  appNamesText,
  onOpenMyLedger,
}: DeviceOutOfStorageSpaceViewProps) {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t("deviceIntentExecutor.initialization.blocking.deviceOutOfStorageSpace.title")}
      description={
        <span className="flex flex-col gap-8">
          <span>
            {t("deviceIntentExecutor.initialization.blocking.deviceOutOfStorageSpace.description")}
          </span>
          <span>
            {t("deviceIntentExecutor.initialization.blocking.deviceOutOfStorageSpace.apps", {
              appNames: appNamesText,
            })}
          </span>
        </span>
      }
      primaryCta={{
        label: t("deviceIntentExecutor.initialization.cta.goToMyLedger"),
        onPress: onOpenMyLedger,
      }}
      testID="device-initializer-device-out-of-storage-space"
    />
  );
}
