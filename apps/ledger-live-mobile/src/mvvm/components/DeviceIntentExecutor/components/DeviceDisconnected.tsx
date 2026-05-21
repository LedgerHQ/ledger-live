import React from "react";
import type { DeviceDisconnectedComponent } from "@ledgerhq/device-intent";
import { Trans } from "~/context/Locale";
import { InfoState } from "LLM/components/InfoState";

/**
 * Generic state displayed when the device disconnects mid-flow (during the
 * device-context initialization, intent execution, or while idle).
 */
export const DeviceDisconnected: DeviceDisconnectedComponent = ({ onRetry, onClose }) => (
  <InfoState
    preset="error"
    size="hug"
    title={<Trans i18nKey="deviceIntentExecutor.errors.connectionError.title" />}
    description={<Trans i18nKey="deviceIntentExecutor.errors.connectionError.description" />}
    primaryCta={{
      label: <Trans i18nKey="common.retry" />,
      onPress: onRetry,
    }}
    secondaryCta={{
      label: <Trans i18nKey="common.close" />,
      onPress: onClose,
    }}
    testID="device-intent-executor-device-disconnected"
  />
);
