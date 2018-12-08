/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import colors from "../../colors";
import { deviceNameByDeviceIdSelector } from "../../reducers/ble";
import {
  connectingStep,
  getDeviceName,
} from "../../components/DeviceJob/steps";
import DeviceJob from "../../components/DeviceJob";
import LText from "../../components/LText";
import Row from "./Row";

type Props = {
  navigation: *,
  deviceId: string,
  savedName: string,
};

type State = {
  lastSavedDeviceName: string,
  deviceName: ?string,
  connecting: boolean,
};

class DeviceNameRow extends PureComponent<Props, State> {
  state = {
    lastSavedDeviceName: this.props.savedName,
    deviceName: null,
    connecting: false,
  };

  static getDerivedStateFromProps(
    { savedName }: Props,
    { deviceName, lastSavedDeviceName }: State,
  ) {
    if (deviceName !== null && savedName !== lastSavedDeviceName) {
      return {
        deviceName: savedName,
        lastSavedDeviceName: savedName,
      };
    }
    return null;
  }

  onPress = () => {
    const { navigation, deviceId } = this.props;
    const { deviceName } = this.state;
    if (deviceName !== null) {
      navigation.navigate("EditDeviceName", {
        deviceId,
        deviceName,
      });
    } else {
      this.setState({ connecting: true });
    }
  };

  onCancel = () => {
    this.setState({ connecting: false });
  };

  onDone = (deviceId, { deviceName }) => {
    this.setState({ connecting: false, deviceName });
  };

  render() {
    const { deviceId } = this.props;
    const { deviceName, connecting } = this.state;
    return (
      <Row
        title={<Trans i18nKey="DeviceNameRow.title" />}
        arrowRight={!!deviceName}
        alignedTop
        onPress={this.onPress}
        compact
        top
      >
        {deviceName === null ? (
          <LText semiBold numberOfLines={1} style={styles.action}>
            <Trans i18nKey="DeviceNameRow.action" />
          </LText>
        ) : (
          <LText
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.accountName}
          >
            {deviceName}
          </LText>
        )}

        <DeviceJob
          deviceName={deviceName}
          deviceId={connecting ? deviceId : null}
          onCancel={this.onCancel}
          onDone={this.onDone}
          steps={[connectingStep, getDeviceName]}
        />
      </Row>
    );
  }
}

export default connect(
  createStructuredSelector({
    savedName: deviceNameByDeviceIdSelector,
  }),
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
