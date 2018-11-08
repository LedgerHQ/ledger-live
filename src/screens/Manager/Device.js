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
import colors from "../../colors";

import DeviceNameRow from "./DeviceNameRow";
import FirmwareVersionRow from "./FirmwareVersionRow";
import AuthenticityRow from "./AuthenticityRow";
import UnpairRow from "./UnpairRow";

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

class ManagerDevice extends Component<Props> {
  static navigationOptions = {
    title: "Device",
  };

  render() {
    const deviceId = this.props.navigation.getParam("deviceId");
    const meta = this.props.navigation.getParam("meta");

    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.container}>
        <View style={styles.device}>
          <DeviceNano />
          <LText secondary semiBold style={styles.deviceName}>
            <Trans i18nKey="manager.device.nanox" />
          </LText>
        </View>
        <DeviceNameRow deviceId={deviceId} />
        <AuthenticityRow />
        <FirmwareVersionRow deviceInfo={meta.deviceInfo} />
        <Space h={16} />
        <UnpairRow />
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
    paddingBottom: 48,
  },
  deviceName: {
    fontSize: 22,
    color: colors.darkBlue,
    paddingTop: 24,
  },
});

export default connect(
  null,
  {
    removeKnownDevice,
  },
)(translate()(ManagerDevice));
