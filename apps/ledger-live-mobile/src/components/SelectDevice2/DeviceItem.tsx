import React, { useCallback, useState } from "react";
import { Trans } from "~/context/Locale";
import { Text, Flex, IconsLegacy, Icons } from "@ledgerhq/native-ui";
import { DeviceModelId } from "@ledgerhq/devices";
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

export default function DeviceItem({ displayedDevice, onPress }: Props) {
  const { available } = displayedDevice;
  const { wired } = displayedDevice.device;
  const [isRemoveDeviceMenuOpen, setIsRemoveDeviceMenuOpen] = useState<boolean>(false);

  const wording = wired ? "usb" : available ? "available" : "unavailable";
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
        {!wired ? (
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
