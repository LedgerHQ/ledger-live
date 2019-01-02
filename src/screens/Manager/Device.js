/* @flow */
import React, { Component } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import { translate, Trans } from "react-i18next";
import type {
  DeviceInfo,
  OsuFirmware,
  FinalFirmware,
} from "@ledgerhq/live-common/lib/types/manager";
import manager from "@ledgerhq/live-common/lib/manager";
import { removeKnownDevice } from "../../actions/ble";
import DeviceNano from "../../components/DeviceNanoAction";
import LText from "../../components/LText";
import Space from "../../components/Space";
import Circle from "../../components/Circle";
import colors from "../../colors";
import { deviceNames } from "../../wording";
import { TrackScreen } from "../../analytics";

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

type State = {
  haveUpdate: boolean,
  osu: ?OsuFirmware,
  final: ?FinalFirmware,
};

class DeviceLabel extends Component<Props & { tintColor: string }, State> {
  state = {
    haveUpdate: false,
    osu: null,
    final: null,
  };

  async componentDidMount() {
    const { navigation } = this.props;
    const { deviceInfo } = navigation.getParam("meta");
    const firmware = await manager.getLatestFirmwareForDevice(deviceInfo);
    if (!firmware) return;
    const { osu, final } = firmware;
    this.setState({
      haveUpdate: !!osu,
      osu,
      final,
    });
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
        <TrackScreen category="Manager" name="Device" />
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
    paddingVertical: 16,
  },
  device: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 24,
  },
  deviceName: {
    fontSize: 24,
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
