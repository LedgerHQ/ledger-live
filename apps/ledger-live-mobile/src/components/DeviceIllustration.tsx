import React from "react";
import { Image } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useTheme } from "styled-components/native";

import {
  CLSSupportedDeviceModelId,
  isCustomLockScreenSupported,
} from "@ledgerhq/live-common/device/use-cases/isCustomLockScreenSupported";
import NanoS from "~/images/devices/NanoS";
import NanoX from "~/images/devices/NanoX";
import STAX_DEVICE from "~/components/CustomImage/assets/stax_device.png";
import FLEX_DEVICE from "~/components/CustomImage/assets/flex_device.png";
import APEX_DEVICE from "~/components/CustomImage/assets/apex_device.png";

const illustrations: Record<
  Exclude<DeviceModelId, CLSSupportedDeviceModelId>,
  React.FC<{ color: string; theme: "light" | "dark" }>
> = {
  [DeviceModelId.nanoS]: NanoS,
  [DeviceModelId.nanoSP]: NanoS,
  [DeviceModelId.nanoX]: NanoX,
  [DeviceModelId.blue]: NanoS,
};

const deviceImages = new Map([
  [DeviceModelId.stax, STAX_DEVICE],
  [DeviceModelId.europa, FLEX_DEVICE],
  [DeviceModelId.apex, APEX_DEVICE],
]);

export function DeviceIllustration({ deviceModelId }: { deviceModelId: DeviceModelId }) {
  const { colors, theme } = useTheme();

  return isCustomLockScreenSupported(deviceModelId) ? (
    <Image
      source={deviceImages.get(deviceModelId)}
      style={{ height: 92, width: 72, backgroundColor: "transparent" }}
      resizeMode="contain"
      fadeDuration={0}
    />
  ) : (
    <>{illustrations[deviceModelId]({ color: colors.neutral.c100, theme })}</>
  );
}
