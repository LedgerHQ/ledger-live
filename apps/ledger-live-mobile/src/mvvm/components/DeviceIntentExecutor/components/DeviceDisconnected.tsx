import React from "react";
import type { DeviceDisconnectedComponent } from "@ledgerhq/device-intent";
import { Trans } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import { InfoState } from "LLM/components/InfoState";
import { useSourceFlow } from "../utils/SourceFlowContext";
import {
  getConnectedDeviceTrackingProperties,
  PAGE_DEVICE_ACTION,
} from "../utils/trackDeviceIntent";

/**
 * Generic state displayed when the device disconnects mid-flow (during the
 * device-context initialization, intent execution, or while idle).
 */
export const DeviceDisconnected: DeviceDisconnectedComponent = ({ device, onRetry, onClose }) => {
  const sourceFlow = useSourceFlow();
  const { modelId, transport } = getConnectedDeviceTrackingProperties(device);

  return (
    <>
      <TrackScreen
        category={PAGE_DEVICE_ACTION.Disconnected}
        sourceFlow={sourceFlow}
        modelId={modelId}
        transport={transport}
        deviceUxV2
      />
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
    </>
  );
};
