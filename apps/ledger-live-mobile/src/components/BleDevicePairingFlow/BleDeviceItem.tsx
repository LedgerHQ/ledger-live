import React, { useMemo } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { Flex, Icons, IconsLegacy, Text } from "@ledgerhq/native-ui";
import { ChevronRightMedium } from "@ledgerhq/native-ui/assets/icons";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { DeviceModelId } from "@ledgerhq/types-devices";

export type RenderedDevice = Device & {
  isAlreadyKnown: boolean;
};

type Props = {
  deviceMeta: RenderedDevice;
  areKnownDevicesPairable?: boolean;
  onSelect: () => void;
};

const BleDeviceItem = ({ deviceMeta, onSelect, areKnownDevicesPairable }: Props) => {
  const { t } = useTranslation();
  const { deviceName, isAlreadyKnown } = deviceMeta;

  const deviceIcon = useMemo(() => {
    switch (deviceMeta.modelId) {
      case DeviceModelId.stax:
        return <IconsLegacy.StaxMedium size={20} />;
      case DeviceModelId.europa:
        return <Icons.Flex size="S" />;
      case DeviceModelId.nanoX:
      default:
        return <IconsLegacy.NanoXFoldedMedium size={20} />;
    }
  }, [deviceMeta.modelId]);

  if (isAlreadyKnown && !areKnownDevicesPairable) {
    return (
      <Flex mb={3} opacity="0.5">
        <Flex
          alignItems="center"
          flexDirection="row"
          backgroundColor="neutral.c30"
          borderRadius={8}
          padding={6}
        >
          {deviceIcon}
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
      <TouchableOpacity onPress={onSelect} testID={`device-scanned-${deviceMeta.deviceId}`}>
        <Flex
          alignItems="center"
          flexDirection="row"
          backgroundColor="neutral.c30"
          borderRadius={8}
          padding={6}
        >
          {deviceIcon}
          <Text flex={1} ml={4} variant="large" fontWeight="semiBold">
            {deviceName}
          </Text>
          <ChevronRightMedium size={20} color="neutral.c70" />
        </Flex>
      </TouchableOpacity>
    </Flex>
  );
};

export default BleDeviceItem;
