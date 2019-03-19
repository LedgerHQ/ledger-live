/* @flow */
import React, { PureComponent } from "react";
import { connect } from "react-redux";
import type { NavigationScreenProp } from "react-navigation";
import { StyleSheet } from "react-native";
// $FlowFixMe
import { ScrollView } from "react-navigation";
import config from "react-native-config";
import { createStructuredSelector } from "reselect";
import { accountsSelector } from "../../../reducers/accounts";
import { TrackScreen } from "../../../analytics";
import SettingsRow from "../../../components/SettingsRow";
import SelectDevice from "../../../components/SelectDevice";

import GenerateMockAccounts from "./GenerateMockAccounts";
import ImportBridgeStreamData from "./ImportBridgeStreamData";
import ConfigUSBDeviceSupport from "./ConfigUSBDeviceSupport";
import OpenDebugCrash from "./OpenDebugCrash";
import OpenDebugHttpTransport from "./OpenDebugHttpTransport";
import OpenDebugIcons from "./OpenDebugIcons";
import OpenDebugSVG from "./OpenDebugSVG";
import ReadOnlyModeRow from "../General/ReadOnlyModeRow";
import OpenDebugStore from "./OpenDebugStore";
import OpenLottie from "./OpenDebugLottie";
import SkipLock from "../../../components/behaviour/SkipLock";

class DebugMocks_ extends PureComponent<{
  accounts: *,
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: "Mock & Test",
  };

  render() {
    const { accounts } = this.props;
    return (
      <ScrollView contentContainerStyle={styles.root}>
        {config.BRIDGESTREAM_DATA ? (
          // $FlowFixMe
          <ImportBridgeStreamData
            title="Import .env BRIDGESTREAM_DATA"
            dataStr={config.BRIDGESTREAM_DATA}
          />
        ) : null}
        {accounts.length === 0 ? (
          <GenerateMockAccounts title="Generate 10 mock Accounts" count={10} />
        ) : null}
        <OpenDebugCrash />
        <OpenDebugStore />
        <OpenDebugIcons />
        <OpenLottie />
        <OpenDebugSVG />
        <ReadOnlyModeRow />
        <SkipLock />
      </ScrollView>
    );
  }
}

export const DebugMocks = connect(
  createStructuredSelector({
    accounts: accountsSelector,
  }),
)(DebugMocks_);

export class DebugDevices extends PureComponent<{
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: "Debug Devices",
  };

  onSelect = (meta: *) => {
    this.props.navigation.navigate("DebugBLE", meta);
  };

  render() {
    return (
      <ScrollView contentContainerStyle={styles.root}>
        <OpenDebugHttpTransport />
        <ConfigUSBDeviceSupport />
        <SelectDevice onSelect={this.onSelect} />
      </ScrollView>
    );
  }
}

class DebugSettings extends PureComponent<{
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: "Debug",
  };

  render() {
    const { navigation } = this.props;
    return (
      <ScrollView contentContainerStyle={styles.root}>
        <TrackScreen category="Settings" name="Debug" />
        <SettingsRow
          title="Mock & Test"
          onPress={() => navigation.navigate("DebugMocks")}
        />
        <SettingsRow
          title="Debug Devices"
          onPress={() => navigation.navigate("DebugDevices")}
        />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 16,
    paddingBottom: 64,
  },
  container: {
    marginTop: 16,
  },
});

export default DebugSettings;
