import React from "react";
import { useTranslation } from "react-i18next";
import {
  RetryableStateType,
  type EnsureAppReadyState,
  useDeviceIntentTracking,
} from "@ledgerhq/live-dmk-shared";
import { InfoState } from "@shared/ui-info-state";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import {
  CONNECT_APP_BUTTON,
  PAGE_CONNECT_APP,
  trackConnectAppButtonClicked,
} from "../../utils/trackDeviceIntent";
import type { BaseInitializerStateProps } from "../types";

type DeviceBusyStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.DeviceBusy }>
>;

export function DeviceBusyState({ state, device, onCancel }: DeviceBusyStateProps) {
  const { t } = useTranslation();
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();

  const trackButtonClick = (button: string) => {
    trackConnectAppButtonClicked({
      sourceFlow,
      modelId: device.modelId,
      button,
      extraProperties: analyticsProperties,
    });
  };

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_APP.DeviceBusy}
        modelId={device.modelId}
        refreshSource
      />
      <InfoState
        preset="info"
        size="hug"
        title={t("deviceIntentExecutor.initialization.retryable.deviceBusy.title")}
        description={t("deviceIntentExecutor.initialization.retryable.deviceBusy.description")}
        primaryCta={{
          label: t("common.retry"),
          onPress: () => {
            trackButtonClick(CONNECT_APP_BUTTON.Retry);
            state.retry();
          },
        }}
        secondaryCta={{
          label: t("deviceIntentExecutor.initialization.cta.cancelOperation"),
          onPress: () => {
            trackButtonClick(CONNECT_APP_BUTTON.Close);
            onCancel();
          },
        }}
        testID="device-initializer-device-busy"
      />
    </>
  );
}
