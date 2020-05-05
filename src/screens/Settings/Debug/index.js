/* @flow */
import React from "react";
import { useSelector } from "react-redux";
import { StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import config from "react-native-config";
import { accountsSelector } from "../../../reducers/accounts";
import { TrackScreen } from "../../../analytics";
import SettingsRow from "../../../components/SettingsRow";
import SelectDevice from "../../../components/SelectDevice";
import { ScreenName } from "../../../const";

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
import NavigationScrollView from "../../../components/NavigationScrollView";

export function DebugMocks() {
  const accounts = useSelector(accountsSelector);

  return (
    <NavigationScrollView contentContainerStyle={styles.root}>
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
    </NavigationScrollView>
  );
}

export function DebugDevices() {
  const { navigate } = useNavigation();

  function onSelect(meta: *): void {
    navigate(ScreenName.DebugBLE, meta);
  }

  return (
    <NavigationScrollView contentContainerStyle={styles.root}>
      <OpenDebugHttpTransport />
      <ConfigUSBDeviceSupport />
      <SelectDevice onSelect={onSelect} />
    </NavigationScrollView>
  );
}

export default function DebugSettings({ navigation: { navigate } }: any) {
  return (
    <NavigationScrollView contentContainerStyle={styles.root}>
      <TrackScreen category="Settings" name="Debug" />
      <SettingsRow
        title="Mock & Test"
        onPress={() => navigate(ScreenName.DebugMocks)}
      />
      <SettingsRow
        title="Debug Devices"
        onPress={() => navigate(ScreenName.DebugDevices)}
      />
      <SettingsRow
        title="Export accounts (LiveQR)"
        onPress={() => navigate(ScreenName.DebugExport)}
      />
    </NavigationScrollView>
  );
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
