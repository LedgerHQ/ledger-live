// @flow
import React, { PureComponent } from "react";
import { Animated, View, StyleSheet, Platform } from "react-native";

import type AnimatedValue from "react-native/Libraries/Animated/src/nodes/AnimatedValue";

import colors from "../colors";

type Props = {
  nbSteps: number,
  currentStep: number,
  color?: string,
};

type State = {
  width: AnimatedValue,
};

class Stepper extends PureComponent<Props, State> {
  static defaultProps = {
    color: colors.live,
  };

  state = {
    width: new Animated.Value(
      (this.props.currentStep - 1) / this.props.nbSteps,
    ),
  };

  componentDidMount() {
    const { currentStep, nbSteps } = this.props;
    Animated.timing(this.state.width, {
      toValue: currentStep / nbSteps,
      duration: Platform.OS === "android" ? 0 : 1000,
    }).start();
  }

  render() {
    const { color } = this.props;
    const stepperStyle = {
      backgroundColor: color,
    };

    const width = this.state.width.interpolate({
      inputRange: [0, 1],
      outputRange: ["0%", "100%"],
    });

    return (
      <View style={styles.container}>
        <Animated.View style={[styles.stepper, stepperStyle, { width }]} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    height: 2,
    width: "100%",
  },
  stepper: {
    height: 2,
    width: "100%",
  },
});

export default Stepper;
