// @flow

import React, { Component } from "react";
import { StyleSheet } from "react-native";
// $FlowFixMe
import { SafeAreaView, ScrollView } from "react-navigation";
import { UserRefusedAddress } from "@ledgerhq/live-common/lib/errors";
import colors from "../colors";
import DeviceNanoXAction from "../components/DeviceNanoXAction";

class DebugIcons extends Component<{}> {
  static navigationOptions = {
    title: "Debug Icons",
  };

  render() {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView>
          <DeviceNanoXAction />
          <DeviceNanoXAction screen="validation" action />
          <DeviceNanoXAction screen="home" />
          <DeviceNanoXAction powerAction />
          <DeviceNanoXAction error={new UserRefusedAddress()} />
          <DeviceNanoXAction error={new Error("whatever")} />
        </ScrollView>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

export default DebugIcons;
