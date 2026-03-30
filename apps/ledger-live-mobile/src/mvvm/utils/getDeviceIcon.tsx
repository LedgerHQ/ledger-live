import React, { ComponentType } from "react";
import { Stax, Apex, Flex, Nano } from "@ledgerhq/lumen-ui-rnative/symbols";
import type { IconButton, IconSize } from "@ledgerhq/lumen-ui-rnative";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { ICON_SIZE } from "../components/TopBar/const";
import { StyleProp, ViewStyle } from "react-native";

type SymbolProps = { size?: IconSize; style?: StyleProp<ViewStyle> };

export function getDeviceSymbol(
  lastConnectedDevice: Device | undefined,
): ComponentType<SymbolProps> {
  switch (lastConnectedDevice?.modelId) {
    case DeviceModelId.europa:
      return Flex;
    case DeviceModelId.apex:
      return Apex;
    case DeviceModelId.stax:
      return Stax;
    default:
      return Nano;
  }
}

export type IconComponent = NonNullable<React.ComponentProps<typeof IconButton>["icon"]>;

export function getDeviceIcon(
  lastConnectedDevice: Device | undefined,
  size?: IconSize,
  style?: StyleProp<ViewStyle>,
): React.JSX.Element {
  switch (lastConnectedDevice?.modelId) {
    case DeviceModelId.nanoS:
    case DeviceModelId.nanoSP:
    case DeviceModelId.nanoX:
      return <Nano size={size ?? ICON_SIZE} style={style} color="base" />;
    case DeviceModelId.europa:
      return <Flex size={size ?? ICON_SIZE} style={style} color="base" />;
    case DeviceModelId.apex:
      return <Apex size={size ?? ICON_SIZE} style={style} color="base" />;
    case DeviceModelId.stax:
    default:
      return <Stax size={size ?? ICON_SIZE} style={style} color="base" />;
  }
}
