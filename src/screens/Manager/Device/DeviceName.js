/* @flow */
import React, { useCallback } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { withNavigation } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { deviceNameByDeviceIdSelector } from "../../../reducers/ble";
import { saveBleDeviceName } from "../../../actions/ble";
import LText from "../../../components/LText";

type Props = {
  navigation: *,
  deviceId: string,
  initialDeviceName: string,
  savedName: string,
  saveBleDeviceName: (string, string) => *,
};

const DeviceNameRow = ({
  navigation,
  savedName,
  deviceId,
  initialDeviceName,
}: Props) => {
  const onPress = useCallback(
    () =>
      navigation.navigate("EditDeviceName", {
        deviceId,
        deviceName: savedName,
      }),
    [deviceId, navigation, savedName],
  );

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.5}>
      <LText
        bold
        numberOfLines={1}
        ellipsizeMode="tail"
        style={styles.deviceName}
      >
        {savedName || initialDeviceName}
      </LText>
    </TouchableOpacity>
  );
};

export default connect(
  createStructuredSelector({
    savedName: deviceNameByDeviceIdSelector,
  }),
  { saveBleDeviceName },
)(withNavigation(DeviceNameRow));

const styles = StyleSheet.create({
  deviceName: {
    marginRight: 10,
    fontSize: 16,
    lineHeight: 32,
  },
});
