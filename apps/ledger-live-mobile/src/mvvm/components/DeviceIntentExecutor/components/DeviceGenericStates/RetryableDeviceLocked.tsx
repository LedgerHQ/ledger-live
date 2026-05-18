import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";

type RetryableDeviceLockedProps = Readonly<{
  deviceModelId: DeviceModelId;
  onRetry: () => void;
  testID?: string;
}>;

/**
 * Use this when the device is locked and the user needs to unlock the device and manually retry the action
 * in order to resume the flow.
 */
export function RetryableDeviceLocked({
  deviceModelId,
  onRetry,
  testID,
}: RetryableDeviceLockedProps) {
  const { productName } = getDeviceModel(deviceModelId);

  return (
    <InfoState
      preset="info"
      size="hug"
      title={
        <Trans
          i18nKey="deviceIntentExecutor.genericStates.retryableDeviceLocked.title"
          values={{ productName }}
        />
      }
      description={
        <Trans
          i18nKey="deviceIntentExecutor.genericStates.retryableDeviceLocked.description"
          values={{ productName }}
        />
      }
      primaryCta={{
        label: <Trans i18nKey="common.retry" />,
        onPress: onRetry,
      }}
      testID={testID}
    />
  );
}
