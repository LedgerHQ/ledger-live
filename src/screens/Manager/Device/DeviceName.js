/* @flow */
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation, useTheme } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { Trans } from "react-i18next";
import { deviceNameByDeviceIdSelectorCreator } from "../../../reducers/ble";
import LText from "../../../components/LText";
import Touchable from "../../../components/Touchable";
import Edit from "../../../icons/Edit";

import { ScreenName } from "../../../const";

type Props = {
  deviceId: string,
  initialDeviceName: string,
  deviceModel: { id: string, productName: string },
  disabled: boolean,
};

export default function DeviceNameRow({
  deviceId,
  initialDeviceName,
  deviceModel: { id, productName },
  disabled,
}: Props) {
  const { colors } = useTheme();
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

  return (
    <View style={styles.root}>
      <LText
        bold
        numberOfLines={1}
        ellipsizeMode="tail"
        style={styles.deviceName}
      >
        {savedName || initialDeviceName || productName}
      </LText>
      {id !== "nanoS" && (
        <Touchable
          style={styles.editButton}
          onPress={onPress}
          activeOpacity={0.5}
          event="ManagerDeviceNameEdit"
          disabled={disabled}
        >
          <Edit size={13} color={colors.grey} />
          <LText style={styles.editButtonText} color="grey">
            <Trans i18nKey="common.edit" />
          </LText>
        </Touchable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceName: {
    marginRight: 10,
    fontSize: 16,
    lineHeight: 19,
    flexShrink: 1,
    flexBasis: "auto",
  },
  editButton: {
    flexDirection: "row",
    height: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  editButtonText: {
    paddingLeft: 6,
    fontSize: 12,
  },
});
