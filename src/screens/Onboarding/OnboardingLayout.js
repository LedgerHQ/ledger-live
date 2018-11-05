// @flow

import React, { Component } from "react";
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";

type Props = {
  children: *,
  centered?: boolean,
};

class OnboardingLayout extends Component<Props> {
  render() {
    const { children, centered } = this.props;
    return (
      <SafeAreaView style={[styles.root, centered && styles.centered]}>
        {children}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    backgroundColor: "white",
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default OnboardingLayout;
