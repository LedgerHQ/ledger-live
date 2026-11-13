import React from "react";
import { Image, type ImageSourcePropType } from "react-native";
import { DeviceModelId } from "@ledgerhq/types-devices";

const PACKSHOT_SIZE = 48;

const packshots: Record<DeviceModelId, ImageSourcePropType> = {
  [DeviceModelId.nanoS]: require("@assets/images/devices/nanoSNew.webp"),
  [DeviceModelId.nanoSP]: require("@assets/images/devices/nanoSPNew.webp"),
  [DeviceModelId.nanoX]: require("@assets/images/devices/nanoXNew.webp"),
  [DeviceModelId.stax]: require("@assets/images/devices/staxNew.webp"),
  [DeviceModelId.europa]: require("@assets/images/devices/flexNew.webp"),
  [DeviceModelId.apex]: require("@assets/images/devices/gen5New.webp"),
  [DeviceModelId.blue]: require("@assets/images/devices/nanoSNew.webp"),
};

export function DevicePackshot({
  deviceModelId,
}: Readonly<{ deviceModelId: DeviceModelId }>): React.JSX.Element {
  return (
    <Image
      source={packshots[deviceModelId]}
      style={{ width: PACKSHOT_SIZE, height: PACKSHOT_SIZE }}
      resizeMode="contain"
    />
  );
}
