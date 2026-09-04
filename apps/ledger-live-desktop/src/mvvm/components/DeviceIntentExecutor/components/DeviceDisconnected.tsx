import React from "react";
import { useTranslation } from "react-i18next";
import type { DeviceDisconnectedComponent } from "@features/platform-device-intent";
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared";
import { InfoState } from "@shared/ui-info-state";
import { TrackDIEScreen } from "./TrackDIEScreen";
import {
  DEVICE_ACTION_BUTTON,
  getConnectedDeviceTrackingProperties,
  PAGE_DEVICE_ACTION,
  trackDeviceActionButtonClicked,
} from "../utils/trackDeviceIntent";

export const DeviceDisconnected: DeviceDisconnectedComponent = ({ device, onRetry, onClose }) => {
  const { t } = useTranslation();
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const { modelId, transport } = getConnectedDeviceTrackingProperties(device);
  const handleRetry = () => {
    trackDeviceActionButtonClicked({
      sourceFlow,
      button: DEVICE_ACTION_BUTTON.Retry,
      modelId,
      transport,
      extraProperties: analyticsProperties,
    });
    onRetry();
  };
  const handleClose = () => {
    trackDeviceActionButtonClicked({
      sourceFlow,
      button: DEVICE_ACTION_BUTTON.Close,
      modelId,
      transport,
      extraProperties: analyticsProperties,
    });
    onClose();
  };

  return (
    <>
      <TrackDIEScreen
        category={PAGE_DEVICE_ACTION.Disconnected}
        modelId={modelId}
        transport={transport}
        refreshSource
      />
      <InfoState
        preset="error"
        size="hug"
        title={t("deviceIntentExecutor.errors.connectionError.title")}
        description={t("deviceIntentExecutor.errors.connectionError.description")}
        primaryCta={{
          label: t("common.retry"),
          onPress: handleRetry,
        }}
        secondaryCta={{
          label: t("common.close"),
          onPress: handleClose,
        }}
        testID="device-intent-executor-device-disconnected"
      />
    </>
  );
};
