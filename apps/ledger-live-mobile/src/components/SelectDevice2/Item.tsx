import React, { useCallback, useMemo, useState } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Trans } from "react-i18next";
import { Text, Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { OthersMedium } from "@ledgerhq/native-ui/assets/icons";
import { DeviceModelId } from "@ledgerhq/devices";

import Touchable from "../Touchable";
import RemoveDeviceMenu from "./RemoveDeviceMenu";

type Props = {
  device: Device & { available?: boolean };
  isScanning?: boolean;
  onPress: (_: Device) => void;
};

// This item will also come from the pr from alexandre.
const Item = ({ device, onPress }: Props) => {
  const { wired, available } = device;
  const [isRemoveDeviceMenuOpen, setIsRemoveDeviceMenuOpen] = useState<boolean>(false);

  const wording = wired ? "usb" : available ? "available" : "unavailable";
  const color = wording === "unavailable" ? "neutral.c60" : "primary.c80";

  const onItemContextPress = useCallback(() => {
    setIsRemoveDeviceMenuOpen(true);
  }, []);

  const deviceIcon = useMemo(() => {
    switch (device.modelId) {
      case DeviceModelId.nanoS:
      case DeviceModelId.nanoSP:
        return <IconsLegacy.NanoSFoldedMedium size={24} />;
      case DeviceModelId.stax:
        return <IconsLegacy.StaxMedium size={24} />;
      case DeviceModelId.nanoX:
      default:
        return <IconsLegacy.NanoXFoldedMedium size={24} />;
    }
  }, [device.modelId]);

  return (
    <Touchable onPress={() => onPress(device)} touchableTestID={"device-item-" + device.deviceId}>
      <Flex
        backgroundColor="neutral.c30"
        borderRadius={2}
        flexDirection="row"
        alignItems="center"
        mb={4}
        padding={4}
      >
        {deviceIcon}

        <Flex ml={5} flex={1}>
          <Text color="neutral.c100" fontWeight="semiBold" fontSize="16px">
            {device.deviceName}
          </Text>
          <Text color={color} fontSize="12px">
            <Trans i18nKey={`manager.selectDevice.item.${wording}`} />
          </Text>
        </Flex>

        {!wired ? (
          <>
            <Touchable event="ItemForget" onPress={onItemContextPress}>
              <OthersMedium size={24} color={"neutral.c100"} />
            </Touchable>
            <RemoveDeviceMenu
              open={isRemoveDeviceMenuOpen}
              device={device}
              onHideMenu={() => setIsRemoveDeviceMenuOpen(false)}
            />
          </>
        ) : null}
      </Flex>
    </Touchable>
  );
};

export default Item;
