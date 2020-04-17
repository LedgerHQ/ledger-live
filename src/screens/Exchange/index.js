// @flow

import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
// $FlowFixMe
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import colors from "../../colors";
import extraStatusBarPadding from "../../logic/extraStatusBarPadding";
import TrackScreen from "../../analytics/TrackScreen";
import ComingSoon from "../../icons/ComingSoon";

const forceInset = { bottom: "always" };

type Props = {
  navigation: NavigationScreenProp<*>,
};

class ExchangeScreen extends Component<Props> {
  static navigationOptions = {
    header: null,
  };

  render() {
    return (
      <SafeAreaView
        style={[styles.root, { paddingTop: extraStatusBarPadding }]}
        forceInset={forceInset}
      >
        <TrackScreen category="Exchange" />
        <View style={styles.body}>
          <ComingSoon />
        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.lightGrey,
  },
  body: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 64,
  },
});

export default ExchangeScreen;
