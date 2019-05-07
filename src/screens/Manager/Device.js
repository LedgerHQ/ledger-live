/* @flow */
import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import { connect } from "react-redux";
// $FlowFixMe
import { ScrollView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { translate, Trans } from "react-i18next";
import type {
  DeviceInfo,
  OsuFirmware,
  FinalFirmware,
} from "@ledgerhq/live-common/lib/types/manager";
import manager from "@ledgerhq/live-common/lib/manager";
import { getDeviceModel } from "@ledgerhq/devices";
import { removeKnownDevice } from "../../actions/ble";
import DeviceNanoAction from "../../components/DeviceNanoAction";
import LText from "../../components/LText";
import Space from "../../components/Space";
import Circle from "../../components/Circle";
import colors from "../../colors";
import { TrackScreen } from "../../analytics";

import DeviceNameRow from "./DeviceNameRow";
import FirmwareVersionRow from "./FirmwareVersionRow";
import FirmwareUpdateRow from "./FirmwareUpdateRow";
import AuthenticityRow from "./AuthenticityRow";
import RemoveRow from "./RemoveRow";
import DeviceRemoveAction from "./DeviceRemoveAction";

type Props = {
  navigation: NavigationScreenProp<{
    params: {
      deviceId: string,
      meta: {
        deviceName: string,
        deviceInfo: DeviceInfo,
        modelId: *,
        wired: *,
        deviceId: *,
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
    const meta = this.props.navigation.getParam("meta");

    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.container}>
        <TrackScreen category="Manager" name="Device" />
        <View style={styles.device}>
          <DeviceNanoAction modelId={meta.modelId} wired={meta.wired} />
          <LText secondary semiBold style={styles.deviceName}>
            {getDeviceModel(meta.modelId).productName}
          </LText>
          <FirmwareUpdateRow
            deviceInfo={meta.deviceInfo}
            deviceId={meta.deviceId}
          />
        </View>
        {meta.wired ? null : (
          <DeviceNameRow
            deviceId={meta.deviceId}
            initialDeviceName={meta.deviceName}
          />
        )}
        <AuthenticityRow />
        <FirmwareVersionRow deviceInfo={meta.deviceInfo} />
        <Space h={16} />
        {meta.wired ? null : (
          <RemoveRow onPress={this.open} deviceId={meta.deviceId} />
        )}
        <DeviceRemoveAction
          opened={this.state.opened}
          onClose={this.close}
          deviceId={meta.deviceId}
          modelId={meta.modelId}
        />
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
