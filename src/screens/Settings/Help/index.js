/* @flow */
import React, { PureComponent } from "react";
import type { NavigationScreenProp } from "react-navigation";
import { ScrollView, View } from "react-native";
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
      <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
        <LedgerSupportRow />
        <ConfigureDeviceRow />
        <View style={{ marginTop: 16 }}>
          <ClearCacheRow />
          <HardResetRow />
        </View>
      </ScrollView>
    );
  }
}

export default HelpSettings;
