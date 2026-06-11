import React from "react";
import type { DeviceDisconnectedComponent } from "@ledgerhq/device-intent";
import { Trans } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import { InfoState } from "LLM/components/InfoState";
import { useSourceFlow } from "../utils/SourceFlowContext";
import {
  DEVICE_ACTION_BUTTON,
  getConnectedDeviceTrackingProperties,
  PAGE_DEVICE_ACTION,
  trackDeviceActionButtonClicked,
} from "../utils/trackDeviceIntent";

/**
 * Generic state displayed when the device disconnects mid-flow (during the
 * device-context initialization, intent execution, or while idle).
 */
export const DeviceDisconnected: DeviceDisconnectedComponent = ({ device, onRetry, onClose }) => {
  const sourceFlow = useSourceFlow();
  const { modelId, transport } = getConnectedDeviceTrackingProperties(device);
  const handleRetry = () => {
    trackDeviceActionButtonClicked({
      sourceFlow,
      button: DEVICE_ACTION_BUTTON.Retry,
      modelId,
      transport,
    });
    onRetry();
  };
  const handleClose = () => {
    trackDeviceActionButtonClicked({
      sourceFlow,
      button: DEVICE_ACTION_BUTTON.Close,
      modelId,
      transport,
    });
    onClose();
  };

  return (
    <>
      <TrackScreen
        category={PAGE_DEVICE_ACTION.Disconnected}
        sourceFlow={sourceFlow}
        modelId={modelId}
        transport={transport}
        refreshSource
        deviceUxV2
      />
      <InfoState
        preset="error"
        size="hug"
        title={<Trans i18nKey="deviceIntentExecutor.errors.connectionError.title" />}
        description={<Trans i18nKey="deviceIntentExecutor.errors.connectionError.description" />}
        primaryCta={{
          label: <Trans i18nKey="common.retry" />,
          onPress: handleRetry,
        }}
        secondaryCta={{
          label: <Trans i18nKey="common.close" />,
          onPress: handleClose,
        }}
        testID="device-intent-executor-device-disconnected"
      />
    </>
  );
};
