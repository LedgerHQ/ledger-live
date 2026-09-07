import React from "react";
import { useTranslation } from "react-i18next";
import { getProductName } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { InfoState } from "@shared/ui-info-state";

type RetryableDeviceLockedProps = Readonly<{
  deviceModelId: DeviceModelId;
  onRetry: () => void;
  testID?: string;
}>;

export function RetryableDeviceLocked({
  deviceModelId,
  onRetry,
  testID,
}: RetryableDeviceLockedProps) {
  const { t } = useTranslation();
  const productName = getProductName(deviceModelId);

  return (
    <InfoState
      preset="info"
      size="hug"
      title={t("deviceIntentExecutor.genericStates.retryableDeviceLocked.title", { productName })}
      primaryCta={{
        label: t("common.retry"),
        onPress: onRetry,
      }}
      testID={testID}
    />
  );
}
