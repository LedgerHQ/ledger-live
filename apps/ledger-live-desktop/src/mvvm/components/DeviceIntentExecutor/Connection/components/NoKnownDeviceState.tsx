import React from "react";
import { LedgerDevices } from "@ledgerhq/lumen-ui-react/symbols";
import { useDeviceIntentTracking } from "@ledgerhq/live-dmk-shared";
import { useTranslation } from "react-i18next";

import { InfoState } from "@shared/ui-info-state";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import {
  CONNECT_DEVICE_BUTTON,
  PAGE_CONNECT_DEVICE,
  trackConnectDeviceButtonClicked,
} from "../../utils/trackDeviceIntent";

type NoKnownDeviceStateProps = {
  onConnectLedgerDevice: () => void;
  onBuyLedgerDevice: () => void;
};

export function NoKnownDeviceState({
  onConnectLedgerDevice,
  onBuyLedgerDevice,
}: Readonly<NoKnownDeviceStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const { sourceFlow, analyticsProperties } = useDeviceIntentTracking();
  const handleConnectLedgerDevice = () => {
    trackConnectDeviceButtonClicked({
      sourceFlow,
      button: CONNECT_DEVICE_BUTTON.ConnectDevice,
      extraProperties: analyticsProperties,
    });
    onConnectLedgerDevice();
  };
  const handleBuyLedgerDevice = () => {
    trackConnectDeviceButtonClicked({
      sourceFlow,
      button: CONNECT_DEVICE_BUTTON.BuyDevice,
      extraProperties: analyticsProperties,
    });
    onBuyLedgerDevice();
  };

  return (
    <>
      <TrackDIEScreen category={PAGE_CONNECT_DEVICE.NoKnownDevice} refreshSource />
      <InfoState
        preset="spot"
        spotProps={{ icon: LedgerDevices }}
        size="hug"
        title={t("deviceIntentExecutor.connectDevice.states.noKnownDevice.title")}
        description={t("deviceIntentExecutor.connectDevice.states.noKnownDevice.description")}
        primaryCta={{
          label: t("deviceIntentExecutor.connectDevice.states.noKnownDevice.connectLedgerDevice"),
          onPress: handleConnectLedgerDevice,
        }}
        secondaryCta={{
          label: t("deviceIntentExecutor.connectDevice.states.noKnownDevice.noLedgerDevice"),
          onPress: handleBuyLedgerDevice,
        }}
        testID="device-intent-executor-connect-device-no-known-device"
      />
    </>
  );
}
