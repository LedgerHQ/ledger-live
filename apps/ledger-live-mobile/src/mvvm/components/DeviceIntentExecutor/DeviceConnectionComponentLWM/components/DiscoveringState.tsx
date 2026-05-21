import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import {
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import { useTranslation } from "~/context/Locale";
import { DeviceListItem } from "./DeviceListItem";

type DiscoveringStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.Discovering }>;
};

export function DiscoveringState({ state }: Readonly<DiscoveringStateProps>): React.ReactNode {
  const { t } = useTranslation();

  return (
    <Box lx={{ width: "full", gap: "s16", paddingHorizontal: "s8" }}>
      <Text
        typography="heading4SemiBold"
        lx={{ color: "base", textAlign: "left" }}
      >
        {t("deviceIntentExecutor.connectDevice.states.discovering.title")}
      </Text>
      <Box>
        {state.devices.map(device => (
          <DeviceListItem key={device.knownDevice.id} device={device} />
        ))}
      </Box>
    </Box>
  );
}
