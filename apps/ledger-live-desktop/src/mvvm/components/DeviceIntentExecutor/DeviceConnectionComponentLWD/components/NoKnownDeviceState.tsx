import React from "react";
import { LedgerDevices } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "react-i18next";

import { InfoState } from "LLD/components/InfoState";

type NoKnownDeviceStateProps = {
  onConnectLedgerDevice: () => void;
  onBuyLedgerDevice: () => void;
};

export function NoKnownDeviceState({
  onConnectLedgerDevice,
  onBuyLedgerDevice,
}: Readonly<NoKnownDeviceStateProps>): React.ReactNode {
  const { t } = useTranslation();

  return (
    <InfoState
      preset="spot"
      spotProps={{ icon: LedgerDevices }}
      size="hug"
      title={t("deviceIntentExecutor.connectDevice.states.noKnownDevice.title")}
      description={t("deviceIntentExecutor.connectDevice.states.noKnownDevice.description")}
      primaryCta={{
        label: t("deviceIntentExecutor.connectDevice.states.noKnownDevice.connectLedgerDevice"),
        onPress: onConnectLedgerDevice,
      }}
      secondaryCta={{
        label: t("deviceIntentExecutor.connectDevice.states.noKnownDevice.noLedgerDevice"),
        onPress: onBuyLedgerDevice,
      }}
      testID="device-intent-executor-connect-device-no-known-device"
    />
  );
}
