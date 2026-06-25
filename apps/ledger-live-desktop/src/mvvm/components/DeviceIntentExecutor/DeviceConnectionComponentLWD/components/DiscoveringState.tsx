import React from "react";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-desktop";
import { useTranslation } from "react-i18next";

import { DeviceListItem } from "./DeviceListItem";

type DiscoveringStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.Discovering }>;
};

export function DiscoveringState({ state }: Readonly<DiscoveringStateProps>): React.ReactNode {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col gap-16 px-16 py-24">
      <h3 className="heading-4-semi-bold text-left text-base">
        {t("deviceIntentExecutor.connectDevice.states.discovering.title")}
      </h3>
      <div className="flex flex-col">
        {state.devices.map(device => (
          <DeviceListItem
            key={`${device.knownDevice.transport}-${device.knownDevice.deviceModelId}`}
            device={device}
          />
        ))}
      </div>
    </div>
  );
}
