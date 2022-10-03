import React from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flex, Text } from "@ledgerhq/native-ui";
import {
  DroprightMedium,
  NanoFoldedMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { TouchableOpacity } from "react-native-gesture-handler";

type Props = {
  deviceMeta: Device;
  onSelect: () => any;
};

const BleDeviceItem = ({ deviceMeta, onSelect }: Props) => (
  <Flex mb={3}>
    <TouchableOpacity onPress={onSelect}>
      <Flex
        flexDirection="row"
        backgroundColor="neutral.c30"
        borderRadius={8}
        padding={6}
      >
        <NanoFoldedMedium size={20} />
        <Text flex={1} ml={4} variant="large" fontWeight="semiBold">
          {deviceMeta.deviceName}
        </Text>
        <DroprightMedium size={20} color="primary.c80" />
      </Flex>
    </TouchableOpacity>
  </Flex>
);

export default BleDeviceItem;
