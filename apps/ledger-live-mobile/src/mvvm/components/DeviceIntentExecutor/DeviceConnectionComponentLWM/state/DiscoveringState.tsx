import React from "react";
import {
  Box,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Spot,
  Tag,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import {
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  type DisplayedDevice,
} from "@ledgerhq/live-dmk-mobile";
import { getDeviceSymbolByModelId } from "LLM/utils/getDeviceIcon";
import { useTranslation } from "~/context/Locale";

type DiscoveringStateProps = {
  state: Extract<ConnectDeviceUIState, { type: ConnectDeviceUIStateTypes.Discovering }>;
};

function getDeviceName(device: DisplayedDevice["knownDevice"], fallbackName: string): string {
  return device.name ?? fallbackName;
}

function DeviceListItem({ device }: { device: DisplayedDevice }): React.ReactNode {
  const { t } = useTranslation();
  const DeviceIcon = getDeviceSymbolByModelId(device.knownDevice.deviceModelId);
  const isAvailable = device.type === "available";

  return (
    <ListItem onPress={device.onSelect} lx={{ marginHorizontal: "-s8" }}>
      <ListItemLeading>
        <Spot size={48} appearance="icon" icon={DeviceIcon} />
        <ListItemContent>
          <ListItemTitle typography="body2SemiBold">
            {getDeviceName(
              device.knownDevice,
              t("deviceIntentExecutor.connectDevice.common.ledgerDevice"),
            )}
          </ListItemTitle>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <Tag
          appearance={isAvailable ? "accent-subtle" : "gray"}
          label={t(
            isAvailable
              ? "deviceIntentExecutor.connectDevice.common.available"
              : "deviceIntentExecutor.connectDevice.common.notConnected",
          )}
          size="md"
        />
      </ListItemTrailing>
    </ListItem>
  );
}

export function DiscoveringState({ state }: DiscoveringStateProps): React.ReactNode {
  const { t } = useTranslation();

  return (
    <Box lx={{ width: "full", gap: "s16" }}>
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
