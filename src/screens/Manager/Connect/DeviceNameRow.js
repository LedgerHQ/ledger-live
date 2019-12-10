/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import colors from "../../../colors";
import { deviceNameByDeviceIdSelector } from "../../../reducers/ble";
import { saveBleDeviceName } from "../../../actions/ble";
import LText from "../../../components/LText";
import Row from "./Row";

type Props = {
  navigation: *,
  deviceId: string,
  initialDeviceName: string,
  savedName: string,
  saveBleDeviceName: (string, string) => *,
};

class DeviceNameRow extends PureComponent<Props> {
  componentDidMount() {
    this.sync();
  }

  sync() {
    const {
      initialDeviceName,
      savedName,
      deviceId,
      saveBleDeviceName,
    } = this.props;
    if (initialDeviceName && initialDeviceName !== savedName) {
      saveBleDeviceName(deviceId, initialDeviceName);
    }
  }

  onPress = () => {
    const { navigation, deviceId, savedName } = this.props;
    navigation.navigate("EditDeviceName", {
      deviceId,
      deviceName: savedName,
    });
  };

  render() {
    const { savedName } = this.props;
    return (
      <Row
        title={<Trans i18nKey="DeviceNameRow.title" />}
        arrowRight
        alignedTop
        onPress={this.onPress}
        compact
        top
      >
        <LText
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.accountName}
        >
          {savedName}
        </LText>
      </Row>
    );
  }
}

export default connect(
  createStructuredSelector({
    savedName: deviceNameByDeviceIdSelector,
  }),
  { saveBleDeviceName },
)(withNavigation(DeviceNameRow));

const styles = StyleSheet.create({
  accountName: {
    flexShrink: 1,
    textAlign: "right",
    color: colors.grey,
  },
  action: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: 14,
    color: colors.live,
  },
});
