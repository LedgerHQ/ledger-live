/* @flow */
import React, { PureComponent } from "react";
import type { NavigationScreenProp } from "react-navigation";
import { ScrollView, View, StyleSheet } from "react-native";
import LedgerSupportRow from "./LedgerSupportRow";
import ClearCacheRow from "./ClearCacheRow";
import HardResetRow from "./HardResetRow";
import ConfigureDeviceRow from "./ConfigureDeviceRow";

class HelpSettings extends PureComponent<{
  navigation: NavigationScreenProp<*>,
}> {
  static navigationOptions = {
    title: "Help",
  };

  render() {
    return (
      <ScrollView contentContainerStyle={styles.root}>
        <LedgerSupportRow />
        {null && <ConfigureDeviceRow /> // FIXME enable when implemented
        }
        <View style={{ marginTop: 16 }}>
          <ClearCacheRow />
          <HardResetRow />
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  root: { paddingTop: 16, paddingBottom: 100 },
});

export default HelpSettings;
