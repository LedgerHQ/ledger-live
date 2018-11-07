/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { deviceNameByDeviceIdSelector } from "../../reducers/ble";
import SettingsRow from "../../components/SettingsRow";
import LText from "../../components/LText";
import colors from "../../colors";

type Props = {
  navigation: *,
  deviceId: string,
  name: string,
};

class DeviceNameRow extends PureComponent<Props> {
  render() {
    const { navigation, deviceId, name } = this.props;
    return (
      <SettingsRow
        title={<Trans i18nKey="DeviceNameRow.title" />}
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
)(withNavigation(DeviceNameRow));

const styles = StyleSheet.create({
  accountName: {
    flexShrink: 1,
    textAlign: "right",
    color: colors.grey,
  },
});
