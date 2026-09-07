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

type UserRefusedOnDeviceStateProps = BaseInitializerStateProps<
  Extract<EnsureAppReadyState, { type: RetryableStateType.UserRefusedOnDevice }>
>;

export function UserRefusedOnDeviceState({
  state,
  device,
  onCancel,
}: UserRefusedOnDeviceStateProps) {
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
        category={PAGE_CONNECT_APP.UserRefused}
        modelId={device.modelId}
        refreshSource
      />
      <InfoState
        preset="info"
        size="hug"
        title={t("deviceIntentExecutor.initialization.retryable.userRefused.title")}
        primaryCta={{
          label: t("common.close"),
          onPress: () => {
            trackButtonClick(CONNECT_APP_BUTTON.Close);
            onCancel();
          },
        }}
        secondaryCta={{
          label: t("common.retry"),
          onPress: () => {
            trackButtonClick(CONNECT_APP_BUTTON.Retry);
            state.retry();
          },
        }}
        testID="device-initializer-user-refused-on-device"
      />
    </>
  );
}
