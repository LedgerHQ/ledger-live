/* @flow */
import React, { Component } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import { translate, Trans } from "react-i18next";
import type { DeviceInfo } from "../../types/manager";
import { removeKnownDevice } from "../../actions/ble";
import DeviceNano from "../../components/DeviceNanoAction";
import LText from "../../components/LText";
import Space from "../../components/Space";
import Circle from "../../components/Circle";
import colors from "../../colors";
import manager from "../../logic/manager";
import { deviceNames } from "../../wording";

import DeviceNameRow from "./DeviceNameRow";
import FirmwareVersionRow from "./FirmwareVersionRow";
import FirmwareUpdateRow from "./FirmwareUpdateRow";
import AuthenticityRow from "./AuthenticityRow";
import UnpairRow from "./UnpairRow";
import DeviceAction from "./DeviceAction";

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      deviceId: string,
      meta: {
        deviceInfo: DeviceInfo,
      },
    },
  }>,
};

class DeviceLabel extends Component<
  Props & { tintColor: string },
  { haveUpdate: boolean },
> {
  state = {
    haveUpdate: false,
  };

  async componentDidMount() {
    const { navigation } = this.props;
    const { deviceInfo } = navigation.getParam("meta");
    const latestFirmware = await manager
      .getLatestFirmwareForDevice(deviceInfo)
      .catch(() => null);
    this.setState({ haveUpdate: !!latestFirmware });
  }

  render() {
    const { tintColor } = this.props;
    const { haveUpdate } = this.state;
    return (
      <View style={styles.tabBarLabel}>
        <LText semiBold style={[styles.tabBarLabelText, { color: tintColor }]}>
          <Trans i18nKey="ManagerDevice.title" />
        </LText>
        {haveUpdate ? (
          <Circle bg={colors.live} size={16}>
            <LText bold style={styles.notif}>
              1
            </LText>
          </Circle>
        ) : null}
      </View>
    );
  }
}

const DeviceLabelT = translate()(DeviceLabel);

class ManagerDevice extends Component<Props, { opened: boolean }> {
  static navigationOptions = props => ({
    tabBarLabel: labelProps => <DeviceLabelT {...props} {...labelProps} />,
  });

  state = {
    opened: false,
  };

  open = () => this.setState({ opened: true });
  close = () => this.setState({ opened: false });

  render() {
    const deviceId = this.props.navigation.getParam("deviceId");
    const meta = this.props.navigation.getParam("meta");

    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.container}>
        <View style={styles.device}>
          <DeviceNano />
          <LText secondary semiBold style={styles.deviceName}>
            {deviceNames.nanoX.fullDeviceName}
          </LText>
          <FirmwareUpdateRow deviceInfo={meta.deviceInfo} deviceId={deviceId} />
        </View>
        <DeviceNameRow deviceId={deviceId} />
        <AuthenticityRow />
        <FirmwareVersionRow deviceInfo={meta.deviceInfo} />
        <Space h={16} />
        <UnpairRow onPress={this.open} deviceId={deviceId} />
        <DeviceAction opened={this.state.opened} onClose={this.close} />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    paddingVertical: 20,
  },
  device: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 24,
  },
  deviceName: {
    fontSize: 22,
    color: colors.darkBlue,
    paddingTop: 24,
  },
  tabBarLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  tabBarLabelText: {
    fontSize: 14,
    marginRight: 8,
  },
  notif: {
    color: "white",
    fontSize: 9,
  },
});

export default connect(
  null,
  {
    removeKnownDevice,
  },
)(translate()(ManagerDevice));
