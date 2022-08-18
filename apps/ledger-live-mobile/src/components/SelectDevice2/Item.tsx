import React, { useCallback } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { Text, Flex, Icons } from "@ledgerhq/native-ui";
import { OthersMedium } from "@ledgerhq/native-ui/assets/icons";

import Touchable from "../Touchable";

type Props = {
  device: Device;
  isScanning?: boolean;
};

// This item will also come from the pr from alexandre.
const Item = ({ device, isScanning = false }: Props) => {
  const { colors } = useTheme();
  const { name, id, wired, available } = device;

  const wording = wired ? "usb" : available ? "available" : "unavailable";
  const color = wording === "unavailable" ? "neutral.c60" : "primary.c80";

  const onItemPress = useCallback(() => {
    console.log("onItemPress");
    // TODO Track the event of selecting the device and call the received cb
  }, []);

  const onItemContextPress = useCallback(() => {
    console.log("onItemContextPress");
    // TODO Pass the modal callback from the manager to forget a device
  }, []);

  return (
    <Touchable event="something" onPress={onItemPress}>
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
          <Text color="neutral.c100">{name}</Text>
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
    </Touchable>
  );
};

export default Item;
