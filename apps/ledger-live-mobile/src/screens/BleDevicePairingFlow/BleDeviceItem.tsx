import React from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flex, Text } from "@ledgerhq/native-ui";
import {
  DroprightMedium,
  NanoFoldedMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";

export type RenderedDevice = Device & {
  isAlreadyKnown: boolean;
};

type Props = {
  deviceMeta: RenderedDevice;
  onSelect: () => void;
};

const BleDeviceItem = ({ deviceMeta, onSelect }: Props) => {
  const { t } = useTranslation();
  const { deviceName, isAlreadyKnown } = deviceMeta;

  if (isAlreadyKnown) {
    return (
      <Flex mb={3} opacity="0.5">
        <Flex
          flexDirection="row"
          backgroundColor="neutral.c30"
          borderRadius={8}
          padding={6}
        >
          <NanoFoldedMedium size={20} />
          <Flex flexDirection="column">
            <Text flex={1} ml={4} variant="large" fontWeight="semiBold">
              {deviceName}
            </Text>
            <Text flex={1} ml={4} variant="small">
              {t("blePairingFlow.scanning.alreadyPaired")}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    );
  }

  return (
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
            {deviceName}
          </Text>
          <DroprightMedium size={20} color="primary.c80" />
        </Flex>
      </TouchableOpacity>
    </Flex>
  );
};

export default BleDeviceItem;
