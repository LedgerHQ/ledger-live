/* @flow */
import React from "react";
import { useSelector } from "react-redux";
import { View, StyleSheet } from "react-native";
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
import ReadOnlyModeRow from "../General/ReadOnlyModeRow";
import AnalyticsConsoleRow from "./AnalyticsConsoleRow";
import OpenDebugStore from "./OpenDebugStore";
import OpenDebugEnv from "./OpenDebugEnv";
import OpenDebugPlayground from "./OpenDebugPlayground";
import OpenLottie from "./OpenDebugLottie";
import OpenDebugLogs from "./OpenDebugLogs";
import SkipLock from "../../../components/behaviour/SkipLock";
import NavigationScrollView from "../../../components/NavigationScrollView";
import AddMockAnnouncementButton from "./GenerateAnnouncementMockData";
import ToggleMockServiceStatusButton from "./ToggleMockStatusIncident";

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
      <OpenDebugLogs />
      <OpenDebugCrash />
      <OpenDebugStore />
      <OpenDebugEnv />
      <OpenDebugIcons />
      <OpenLottie />
      <OpenDebugPlayground />
      <ReadOnlyModeRow />
      <AnalyticsConsoleRow />
      <AddMockAnnouncementButton title="Mock a new announcement" />
      <ToggleMockServiceStatusButton title="Toggle Service status incident" />
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
      <View style={styles.wrapper}>
        <SelectDevice onSelect={onSelect} />
      </View>
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
        title="Debug Swap"
        onPress={() => navigate(ScreenName.DebugSwap)}
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
  wrapper: {
    padding: 16,
  },
  container: {
    marginTop: 16,
  },
});
