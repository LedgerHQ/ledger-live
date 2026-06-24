import React from "react";
import { useTranslation } from "react-i18next";
import type { DeviceDisconnectedComponent } from "@ledgerhq/device-intent";
import { InfoState } from "LLD/components/InfoState";

export const DeviceDisconnected: DeviceDisconnectedComponent = ({ onRetry, onClose }) => {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="error"
      size="hug"
      title={t("deviceIntentExecutor.errors.connectionError.title")}
      description={t("deviceIntentExecutor.errors.connectionError.description")}
      primaryCta={{
        label: t("common.retry"),
        onPress: onRetry,
      }}
      secondaryCta={{
        label: t("common.close"),
        onPress: onClose,
      }}
      testID="device-intent-executor-device-disconnected"
    />
  );
};
