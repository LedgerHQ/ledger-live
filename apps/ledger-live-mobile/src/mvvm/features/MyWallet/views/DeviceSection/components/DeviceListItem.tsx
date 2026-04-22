import React, { useCallback } from "react";
import { Image, type ImageSourcePropType } from "react-native";
import { DeviceModelId } from "@ledgerhq/devices";
import {
  Box,
  IconButton,
  ListItem,
  ListItemContent,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
} from "@ledgerhq/lumen-ui-rnative";
import { MoreVertical } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "~/context/Locale";
import { type DeviceSectionDevice } from "../useDeviceSectionViewModel";
import { DeviceStatusTag } from "./DeviceStatusTag";

const IMAGE_SIZE = 40;

/* eslint-disable @typescript-eslint/no-require-imports */
const deviceSources: Record<DeviceModelId, ImageSourcePropType> = {
  [DeviceModelId.nanoS]: require("@assets/images/devices/nanoSNew.webp"),
  [DeviceModelId.nanoSP]: require("@assets/images/devices/nanoSPNew.webp"),
  [DeviceModelId.nanoX]: require("@assets/images/devices/nanoXNew.webp"),
  [DeviceModelId.stax]: require("@assets/images/devices/staxNew.webp"),
  [DeviceModelId.europa]: require("@assets/images/devices/flexNew.webp"),
  [DeviceModelId.apex]: require("@assets/images/devices/gen5New.webp"),
  [DeviceModelId.blue]: require("@assets/images/devices/nanoSNew.webp"),
};
/* eslint-enable @typescript-eslint/no-require-imports */

type DeviceListItemProps = {
  readonly device: DeviceSectionDevice;
  readonly onPress: (device: DeviceSectionDevice) => void;
  readonly onOpenMenu: (device: DeviceSectionDevice) => void;
};

export function DeviceListItem({ device, onPress, onOpenMenu }: DeviceListItemProps) {
  const { t } = useTranslation();
  const handlePress = useCallback(() => onPress(device), [device, onPress]);
  const handleMenuPress = useCallback(() => onOpenMenu(device), [device, onOpenMenu]);

  return (
    <ListItem testID={`my-wallet-device-item-${device.id}`} onPress={handlePress}>
      <ListItemLeading>
        <Image
          source={deviceSources[device.modelId]}
          style={{ width: IMAGE_SIZE, height: IMAGE_SIZE }}
          resizeMode="contain"
        />
        <ListItemContent lx={{ gap: "s4" }}>
          <ListItemTitle>{device.name}</ListItemTitle>
          <Box style={{ alignSelf: "flex-start" }}>
            <DeviceStatusTag available={device.available} />
          </Box>
        </ListItemContent>
      </ListItemLeading>
      <ListItemTrailing>
        <IconButton
          appearance="no-background"
          size="md"
          icon={MoreVertical}
          onPress={handleMenuPress}
          testID={`my-wallet-device-item-${device.id}-menu`}
          accessibilityLabel={t("myWallet.deviceSection.menuAccessibilityLabel")}
        />
      </ListItemTrailing>
    </ListItem>
  );
}
