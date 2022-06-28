import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { Flex, Text } from "@ledgerhq/native-ui";
import { PenMedium } from "@ledgerhq/native-ui/assets/icons";

import { TouchableOpacity } from "react-native";
import { deviceNameByDeviceIdSelectorCreator } from "../../../reducers/ble";
import { ScreenName } from "../../../const";

type Props = {
  deviceId: string;
  initialDeviceName: string;
  deviceModel: { id: string; productName: string };
  disabled: boolean;
};

export default function DeviceNameRow({
  deviceId,
  initialDeviceName,
  deviceModel: { id, productName },
  disabled,
}: Props) {
  const navigation = useNavigation();

  const savedName = useSelector(deviceNameByDeviceIdSelectorCreator(deviceId));

  const onPress = useCallback(
    () =>
      navigation.navigate(ScreenName.EditDeviceName, {
        deviceId,
        deviceName: savedName,
      }),
    [deviceId, navigation, savedName],
  );

  const displayedName = savedName || initialDeviceName || productName;

  return (
    <Flex flexDirection={"row"} flexWrap={"nowrap"}>
      <Text
        maxWidth="90%"
        variant={"h2"}
        uppercase={false}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {displayedName.toUpperCase()}
      </Text>
      {id === "nanoX" && (
        <Flex
          ml={3}
          backgroundColor={"palette.primary.c30"}
          borderRadius={12}
          width={24}
          height={24}
          alignItems="center"
          justifyContent="center"
        >
          <TouchableOpacity onPress={onPress} disabled={disabled}>
            <PenMedium size={16} color={"palette.primary.c80"} />
          </TouchableOpacity>
        </Flex>
      )}
    </Flex>
  );
}
