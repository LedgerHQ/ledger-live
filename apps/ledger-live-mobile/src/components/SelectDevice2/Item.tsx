import React, { useCallback, useState } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Trans } from "react-i18next";
import { Text, Flex, Icons } from "@ledgerhq/native-ui";
import { OthersMedium } from "@ledgerhq/native-ui/assets/icons";

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
  const [isRemoveDeviceMenuOpen, setIsRemoveDeviceMenuOpen] =
    useState<boolean>(false);

  const wording = wired ? "usb" : available ? "available" : "unavailable";
  const color = wording === "unavailable" ? "neutral.c60" : "primary.c80";

  const onItemContextPress = useCallback(() => {
    setIsRemoveDeviceMenuOpen(true);
  }, []);

  return (
    <Touchable event="something" onPress={() => onPress(device)}>
      <Flex
        backgroundColor="neutral.c30"
        borderRadius={2}
        flexDirection="row"
        alignItems="center"
        mb={4}
        padding={4}
      >
        {/* TODO account for other device icons */}
        {/* Right now all devices will show the same icon */}
        <Icons.NanoFoldedMedium size={24} />

        <Flex ml={5} flex={1}>
          <Text color="neutral.c100">{device.deviceName}</Text>
          <Text color={color}>
            <Trans i18nKey={`manager.selectDevice.item.${wording}`} />
          </Text>
        </Flex>

        {!wired ? (
          <Touchable event="ItemForget" onPress={onItemContextPress}>
            <OthersMedium size={24} color={"neutral.c100"} />
          </Touchable>
        ) : null}
      </Flex>
      <RemoveDeviceMenu
        open={isRemoveDeviceMenuOpen}
        device={device}
        onHideMenu={() => setIsRemoveDeviceMenuOpen(false)}
      />
    </Touchable>
  );
};

export default Item;
