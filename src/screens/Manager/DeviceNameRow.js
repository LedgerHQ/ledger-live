/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { deviceNameByDeviceIdSelector } from "../../reducers/ble";
import SettingsRow from "../../components/SettingsRow";
import type { T } from "../../types/common";
import LText from "../../components/LText";
import colors from "../../colors";

type Props = {
  t: T,
  navigation: NavigationScreenProp<*>,
  deviceId: string,
  name: string,
};

class DeviceNameRow extends PureComponent<Props> {
  render() {
    const { t, navigation, deviceId, name } = this.props;
    return (
      <SettingsRow
        title={t("DeviceNameRow.title")}
        arrowRight
        alignedTop
        onPress={() =>
          navigation.navigate("EditDeviceName", {
            deviceId,
          })
        }
      >
        <LText
          semiBold
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.accountName}
        >
          {name}
        </LText>
      </SettingsRow>
    );
  }
}

export default connect(
  createStructuredSelector({ name: deviceNameByDeviceIdSelector }),
)(translate()(withNavigation(DeviceNameRow)));

const styles = StyleSheet.create({
  accountName: {
    flexShrink: 1,
    textAlign: "right",
    color: colors.grey,
  },
});
