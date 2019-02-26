// @flow

import React, { Component } from "react";
import { StyleSheet } from "react-native";
// $FlowFixMe
import { SafeAreaView, ScrollView } from "react-navigation";
import { UserRefusedAddress } from "@ledgerhq/live-common/lib/errors";
import colors from "../colors";
// import DeviceNanoXAction from "../components/DeviceNanoXAction";
import DeviceNanoSAction from "../components/DeviceNanoSAction";

class DebugIcons extends Component<{}> {
  static navigationOptions = {
    title: "Debug Icons",
  };

  render() {
    return (
      <SafeAreaView style={styles.root}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          {/* <DeviceNanoXAction />
          <DeviceNanoXAction screen="validation" action />
          <DeviceNanoXAction screen="home" />
          <DeviceNanoXAction powerAction />
          <DeviceNanoXAction error={new UserRefusedAddress()} />
          <DeviceNanoXAction error={new Error("whatever")} /> */}

          <DeviceNanoSAction />
          <DeviceNanoSAction error={new UserRefusedAddress()} />
          <DeviceNanoSAction error={new Error("wahtevr")} />
          <DeviceNanoSAction action="both" screen="validation" connected />
          <DeviceNanoSAction action="left" screen="empty" connected />
          <DeviceNanoSAction screen="home" />
          <DeviceNanoSAction action="right" screen="pin" />
          <DeviceNanoSAction connected />
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
  scrollView: {
    alignItems: "center",
  },
});

export default DebugIcons;
