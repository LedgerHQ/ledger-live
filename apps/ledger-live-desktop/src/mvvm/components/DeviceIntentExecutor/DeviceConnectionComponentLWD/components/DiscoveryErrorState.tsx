import React from "react";
import { getConnectDeviceSubError, useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared";
import {
  BaseDiscoveryErrorTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-desktop";
import { useTranslation } from "react-i18next";

import { InfoState } from "@shared/ui-info-state";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import {
  CONNECT_DEVICE_BUTTON,
  getTrackingTransport,
  PAGE_CONNECT_DEVICE,
  trackConnectDeviceButtonClicked,
} from "../../utils/trackDeviceIntent";

type DiscoveryErrorStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.DiscoveryError }>;
};

export function DiscoveryErrorState({
  state,
}: Readonly<DiscoveryErrorStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const trackingTransport = getTrackingTransport(state.error.transportId);

  if (state.error.type !== BaseDiscoveryErrorTypes.Unknown) {
    return null;
  }

  return (
    <>
      <TrackDIEScreen
        category={PAGE_CONNECT_DEVICE.DiscoveryError}
        {...(trackingTransport ? { transport: trackingTransport } : {})}
        subError={getConnectDeviceSubError(state.error)}
        refreshSource
      />
      <InfoState
        preset="error"
        size="hug"
        title={t("deviceIntentExecutor.connectDevice.states.discoveryError.errors.unknown.title")}
        description={t(
          "deviceIntentExecutor.connectDevice.states.discoveryError.errors.unknown.description",
        )}
        primaryCta={
          state.retry
            ? {
                label: t(
                  "deviceIntentExecutor.connectDevice.states.discoveryError.errors.unknown.cta.retry",
                ),
                onPress: () => {
                  trackConnectDeviceButtonClicked({
                    sourceFlow,
                    button: CONNECT_DEVICE_BUTTON.Retry,
                    extraProperties: analyticsProperties,
                  });
                  state.retry?.();
                },
              }
            : undefined
        }
        testID="device-intent-executor-connect-device-discovery-error"
      />
    </>
  );
}
