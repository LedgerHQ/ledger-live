/* @flow */
import React, { PureComponent } from "react";
import type { NavigationScreenProp } from "react-navigation";
import { ScrollView } from "react-native";
import LedgerSupportRow from "./LedgerSupportRow";
import ClearCacheRow from "./ClearCacheRow";
import HardResetRow from "./HardResetRow";

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
        <ClearCacheRow />
        <HardResetRow />
      </ScrollView>
    );
  }
}

export default HelpSettings;
