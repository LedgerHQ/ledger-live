import React, { useEffect } from "react";
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared";
import {
  BaseConnectionErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-desktop";
import { useTranslation } from "react-i18next";

import { InfoState } from "@shared/ui-info-state";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import {
  CONNECT_DEVICE_BUTTON,
  getTrackingSubError,
  getTrackingTransport,
  PAGE_CONNECT_DEVICE,
  setIsInTerminalConnectDeviceError,
  trackConnectDeviceButtonClicked,
} from "../../utils/trackDeviceIntent";

type ConnectionErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.ConnectionError }>;
};

export function ConnectionErrorState({
  state,
}: Readonly<ConnectionErrorStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();

  useEffect(() => {
    setIsInTerminalConnectDeviceError(true);
    return () => setIsInTerminalConnectDeviceError(false);
  }, []);

  if (state.error.type !== BaseConnectionErrorTypes.Unknown) {
    return null;
  }

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.ConnectionError}
        modelId={state.device.deviceModelId}
        transport={getTrackingTransport(state.device.transport)}
        subError={getTrackingSubError(state.error.type)}
        refreshSource
      />
      <InfoState
        preset="error"
        size="hug"
        title={t("deviceIntentExecutor.connectDevice.states.connectionError.errors.unknown.title")}
        description={t(
          "deviceIntentExecutor.connectDevice.states.connectionError.errors.unknown.description",
        )}
        banner={{
          title: t("deviceIntentExecutor.connectDevice.states.connectionError.errors.unknown.tip"),
        }}
        primaryCta={{
          label: t(
            "deviceIntentExecutor.connectDevice.states.connectionError.errors.unknown.cta.retry",
          ),
          onPress: () => {
            trackConnectDeviceButtonClicked({
              sourceFlow,
              button: CONNECT_DEVICE_BUTTON.Retry,
              extraProperties: analyticsProperties,
            });
            state.retry();
          },
        }}
        testID="device-intent-executor-connect-device-connection-error"
      />
    </>
  );
}
