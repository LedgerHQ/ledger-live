// @flow

import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import LottieView from "lottie-react-native";
import colors from "../colors";

const forceInset = { bottom: "always" };

class DebugLottie extends Component<{}> {
  static navigationOptions = {
    title: "Debug Lottie",
  };

  render() {
    return (
      <SafeAreaView forceInset={forceInset} style={styles.root}>
        <LottieView source={require("../animations/pairing.json")} autoPlay />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  anim: {
    flex: 1,
  },
});

export default DebugLottie;
