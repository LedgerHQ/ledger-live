import React, { useCallback, useState } from "react";
import { Trans } from "~/context/Locale";
import { Text, Flex, IconsLegacy, Icons } from "@ledgerhq/native-ui";
import { DeviceModelId } from "@ledgerhq/devices";
import { isMockServerCompatDeviceId } from "@ledgerhq/live-dmk-shared";
import Touchable from "~/components/Touchable";
import RemoveDeviceMenu from "./RemoveDeviceMenu";
import { type DisplayedDevice } from "./DisplayedDevice";

type Props = {
  displayedDevice: DisplayedDevice;
  isScanning?: boolean;
  onPress: (_: DisplayedDevice) => void;
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

function getStatusWording({ device, available }: DisplayedDevice) {
  if (isMockServerCompatDeviceId(device.deviceId)) return "mocked";
  if (device.wired) return "usb";
  return available ? "available" : "unavailable";
}

export default function DeviceItem({ displayedDevice, onPress }: Props) {
  const { wired, deviceId } = displayedDevice.device;
  const isRemovable = !wired && !isMockServerCompatDeviceId(deviceId);
  const [isRemoveDeviceMenuOpen, setIsRemoveDeviceMenuOpen] = useState<boolean>(false);

  const wording = getStatusWording(displayedDevice);
  const color = wording === "unavailable" ? "neutral.c60" : "primary.c80";
  const testID = `device-item-${displayedDevice.device.deviceId}`;

  const onItemContextPress = useCallback(() => {
    setIsRemoveDeviceMenuOpen(true);
  }, []);

  return (
    <Touchable
      onPress={() => onPress(displayedDevice)}
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
          <DeviceIcon deviceModelId={displayedDevice.device.modelId} />
        </Flex>
        <Flex ml={5} flex={1}>
          <Text color="neutral.c100" fontWeight="semiBold" fontSize="16px">
            {displayedDevice.device.deviceName}
          </Text>
          <Text color={color} fontSize="12px">
            <Trans i18nKey={`manager.selectDevice.item.${wording}`} />
          </Text>
        </Flex>
        {isRemovable ? (
          <>
            <Touchable event="ItemForget" onPress={onItemContextPress}>
              <IconsLegacy.OthersMedium size={24} color={"neutral.c100"} />
            </Touchable>
            <RemoveDeviceMenu
              open={isRemoveDeviceMenuOpen}
              device={displayedDevice.device}
              onHideMenu={() => setIsRemoveDeviceMenuOpen(false)}
            />
          </>
        ) : null}
      </Flex>
    </Touchable>
  );
}
