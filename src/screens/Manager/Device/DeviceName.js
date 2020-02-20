/* @flow */
import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { withNavigation } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { Trans } from "react-i18next";
import { deviceNameByDeviceIdSelector } from "../../../reducers/ble";
import LText from "../../../components/LText";
import Touchable from "../../../components/Touchable";
import colors from "../../../colors";
import Edit from "../../../icons/Edit";

type Props = {
  navigation: *,
  deviceId: string,
  initialDeviceName: string,
  savedName: string,
  deviceModel: { id: string, productName: string },
  disabled: boolean,
};

const DeviceNameRow = ({
  navigation,
  savedName,
  deviceId,
  initialDeviceName,
  deviceModel: { id, productName },
  disabled,
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
          <LText style={styles.editButtonText}>
            <Trans i18nKey="common.edit" />
          </LText>
        </Touchable>
      )}
    </View>
  );
};

export default connect(
  createStructuredSelector({
    savedName: deviceNameByDeviceIdSelector,
  }),
)(withNavigation(DeviceNameRow));

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
  },
  deviceName: {
    marginRight: 10,
    fontSize: 16,
    lineHeight: 19,
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
    color: colors.grey,
    fontSize: 12,
  },
});
