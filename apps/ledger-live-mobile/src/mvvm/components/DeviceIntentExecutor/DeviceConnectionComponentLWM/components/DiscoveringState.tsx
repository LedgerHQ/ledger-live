import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import {
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  type DisplayedDevice,
} from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";
import { TrackDIEScreen } from "../../components/TrackDIEScreen";
import { PAGE_CONNECT_DEVICE } from "../../utils/trackDeviceIntent";
import { DeviceListItem } from "./DeviceListItem";

type DiscoveringStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.Discovering }>;
};

function getDeviceKey(device: DisplayedDevice, index: number): string {
  const { deviceModelId, id, name, transport } = device.knownDevice;

  return `${transport}:${deviceModelId}:${id || name || index}`;
}

export function DiscoveringState({ state }: Readonly<DiscoveringStateProps>): React.ReactNode {
  const { t } = useTranslation();

  return (
    <Box lx={{ width: "full", gap: "s16", paddingHorizontal: "s8" }}>
      <TrackDIEScreen category={PAGE_CONNECT_DEVICE.Discovering} refreshSource />
      <Text typography="heading4SemiBold" lx={{ color: "base", textAlign: "left" }}>
        {t("deviceIntentExecutor.connectDevice.states.discovering.title")}
      </Text>
      <Box>
        {state.devices.map((device, index) => (
          <DeviceListItem key={getDeviceKey(device, index)} device={device} />
        ))}
      </Box>
    </Box>
  );
}
