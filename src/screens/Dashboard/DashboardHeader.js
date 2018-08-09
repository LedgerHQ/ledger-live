// @flow

import React, { Component } from "react";
import { StyleSheet, Animated } from "react-native";

import type AnimatedValue from "react-native/Libraries/Animated/src/nodes/AnimatedValue";

import AnimatedLText from "../../components/LText/AnimatedLText";
import ScrollViewAnimatedHeader from "../../components/ScrollViewAnimatedHeader";

const AnimatedHeader = ({ scrollY }: { scrollY: AnimatedValue }) => {
  const headerTransform = [
    {
      translateY: scrollY.interpolate({
        inputRange: [0, 90],
        outputRange: [0, -90],
        extrapolate: "clamp",
      }),
    },
    {
      scale: scrollY.interpolate({
        inputRange: [-200, 0],
        outputRange: [1.5, 1],
        extrapolate: "clamp",
      }),
    },
  ];

  const textTransform = [
    {
      scale: scrollY.interpolate({
        inputRange: [0, 90],
        outputRange: [1, 0.5],
        extrapolate: "clamp",
      }),
    },

    {
      translateY: scrollY.interpolate({
        inputRange: [0, 90],
        outputRange: [0, 15],
        extrapolate: "clamp",
      }),
    },
  ];

  return (
    <Animated.View style={[styles.header, { transform: headerTransform }]}>
      <AnimatedLText style={[styles.headerText, { transform: textTransform }]}>
        Ledger Live
      </AnimatedLText>
    </Animated.View>
  );
};

type Props = {
  children: React$Node,
};

class DashboardHeader extends Component<Props> {
  render() {
    const { children } = this.props;
    return (
      <ScrollViewAnimatedHeader headerComponent={AnimatedHeader}>
        {children}
      </ScrollViewAnimatedHeader>
    );
  }
}

export default DashboardHeader;

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 10,
    backgroundColor: "white",
  },
  headerText: {
    color: "black",
    fontSize: 30,
  },
});
