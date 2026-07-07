import React from "react";
import {
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  type DisplayedDevice,
} from "@ledgerhq/live-dmk-desktop";
import { useTranslation } from "react-i18next";

import { DeviceListItem } from "./DeviceListItem";

type DiscoveringStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.Discovering }>;
};

function getDeviceKey(device: DisplayedDevice, index: number): string {
  const { deviceModelId, id, name, transport } = device.knownDevice;

  return `${transport}-${deviceModelId}-${id || name || index}`;
}

export function DiscoveringState({ state }: Readonly<DiscoveringStateProps>): React.ReactNode {
  const { t } = useTranslation();
  const hasAvailableDevice = state.devices.some(device => device.type === "available");

  return (
    <div className="flex w-full flex-col gap-16">
      <h3 className="heading-4-semi-bold text-left text-base">
        {t(
          hasAvailableDevice
            ? "deviceIntentExecutor.connectDevice.states.discovering.title"
            : "deviceIntentExecutor.connectDevice.states.discovering.noAvailableDeviceTitle",
        )}
      </h3>
      <div className="flex flex-col">
        {state.devices.map((device, index) => (
          <DeviceListItem key={getDeviceKey(device, index)} device={device} />
        ))}
      </div>
    </div>
  );
}
