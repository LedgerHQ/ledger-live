/* @flow */
import React from "react";
import { View, StyleSheet } from "react-native";
import { TrackScreen } from "../../../analytics";
import LedgerSupportRow from "./LedgerSupportRow";
import ClearCacheRow from "./ClearCacheRow";
import HardResetRow from "./HardResetRow";
import ConfigureDeviceRow from "./ConfigureDeviceRow";
import NavigationScrollView from "../../../components/NavigationScrollView";

export default function HelpSettings() {
  return (
    <NavigationScrollView contentContainerStyle={styles.root}>
      <TrackScreen category="Settings" name="Help" />
      <LedgerSupportRow />
      <ConfigureDeviceRow />
      <View style={styles.container}>
        <ClearCacheRow />
        <HardResetRow />
      </View>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  root: { paddingTop: 16, paddingBottom: 64 },
  container: {
    marginTop: 16,
  },
});
