import React, { useCallback, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { PenMedium } from "@ledgerhq/native-ui/assets/icons";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { isEditDeviceNameSupported } from "@ledgerhq/live-common/device/use-cases/isEditDeviceNameSupported";
import { getDeviceModel } from "@ledgerhq/devices";
import { TouchableOpacity } from "react-native";
import { DeviceInfo } from "@ledgerhq/types-live";
import { ScreenName } from "~/const";

type Props = {
  device: Device;
  deviceInfo: DeviceInfo;
  initialDeviceName?: string | null;
  disabled: boolean;
};

const hitSlop = {
  bottom: 8,
  left: 8,
  right: 8,
  top: 8,
};

export default function DeviceName({ device, initialDeviceName, disabled, deviceInfo }: Props) {
  const navigation = useNavigation();
  const [deviceName, setDeviceName] = useState(initialDeviceName || "");
  const productName = device
    ? getDeviceModel(device.modelId).productName || device.modelId
    : "Ledger Device";

  const isEditSupported = isEditDeviceNameSupported(device.modelId);

  const onPress = useCallback(
    () =>
      navigation.navigate(ScreenName.EditDeviceName, {
        device,
        deviceName,
        deviceInfo,
        onNameChange: setDeviceName,
      }),
    [navigation, device, deviceName, deviceInfo],
  );

  const displayedName = (isEditSupported && deviceName) || productName;

  return (
    <Flex flexDirection={"row"} flexWrap={"nowrap"} alignItems="center">
      <Text
        maxWidth="90%"
        fontWeight="semiBold"
        variant="h4"
        uppercase={false}
        numberOfLines={2}
        ellipsizeMode="tail"
        flexShrink={1}
        testID="manager-device-name"
      >
        {displayedName}
      </Text>
      {isEditSupported && (
        <TouchableOpacity onPress={onPress} disabled={disabled} hitSlop={hitSlop}>
          <Flex
            ml={3}
            backgroundColor={disabled ? "palette.neutral.c30" : "palette.primary.c30"}
            borderRadius={14}
            width={28}
            height={28}
            alignItems="center"
            justifyContent="center"
          >
            <PenMedium size={16} color={disabled ? "palette.neutral.c80" : "palette.primary.c80"} />
          </Flex>
        </TouchableOpacity>
      )}
    </Flex>
  );
}
