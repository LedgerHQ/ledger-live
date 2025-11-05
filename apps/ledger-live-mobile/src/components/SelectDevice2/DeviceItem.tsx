import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import { Text, Flex, IconsLegacy, Icons } from "@ledgerhq/native-ui";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { DeviceModelId } from "@ledgerhq/devices";
import Touchable from "~/components/Touchable";
import RemoveDeviceMenu from "./RemoveDeviceMenu";

type Props = {
  device: Device & { available?: boolean };
  isScanning?: boolean;
  onPress: (_: Device) => void;
};

function DeviceIcon({ deviceModelId }: { deviceModelId: DeviceModelId }) {
  switch (deviceModelId) {
    case DeviceModelId.stax:
      return <Icons.Stax size="M" />;
    case DeviceModelId.europa:
      return <Icons.Flex size="M" />;
    case DeviceModelId.apex:
      return <Icons.Apex size="M" />;
    case DeviceModelId.nanoS:
    case DeviceModelId.nanoSP:
      return <IconsLegacy.NanoSFoldedMedium size={24} />;
    case DeviceModelId.nanoX:
      return <IconsLegacy.NanoXFoldedMedium size={24} />;
    default:
      return <Icons.LedgerDevices size="M" />;
  }
}

export default function DeviceItem({ device, onPress }: Props) {
  const { wired, available } = device;
  const [isRemoveDeviceMenuOpen, setIsRemoveDeviceMenuOpen] = useState<boolean>(false);

  const wording = wired ? "usb" : available ? "available" : "unavailable";
  const color = wording === "unavailable" ? "neutral.c60" : "primary.c80";
  const testID = `device-item-${device.deviceId}`;

  const onItemContextPress = useCallback(() => {
    setIsRemoveDeviceMenuOpen(true);
  }, []);

  return (
    <Touchable
      onPress={() => onPress(device)}
      touchableTestID={testID}
      testID={testID}
      accessibilityRole="button"
    >
      <Flex
        backgroundColor="neutral.c30"
        borderRadius={2}
        flexDirection="row"
        alignItems="center"
        mb={4}
        padding={4}
      >
        <Flex width={24}>
          <DeviceIcon deviceModelId={device.modelId} />
        </Flex>
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
              <IconsLegacy.OthersMedium size={24} color={"neutral.c100"} />
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
}
