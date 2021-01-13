// @flow

import React, { Component } from "react";
import { Animated, View, StyleSheet, Easing } from "react-native";
import { withTheme } from "../colors";

class TouchHintCircle extends Component<{
  stopAnimation: boolean,
  style: *,
  colors: *,
}> {
  leftAnimated = new Animated.Value(0);
  opacityAnimated = new Animated.Value(0);
  growAnimated = new Animated.Value(0);

  componentDidMount() {
    this.startAnimation();
  }

  startAnimation = () => {
    Animated.sequence([
      Animated.timing(this.opacityAnimated, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(this.growAnimated, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(this.leftAnimated, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(this.opacityAnimated, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!this.props.stopAnimation) {
        this.growAnimated.setValue(0);
        this.leftAnimated.setValue(0);
        this.startAnimation();
      }
    });
  };

  render() {
    const { colors } = this.props;
    const translateX = this.leftAnimated.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 80],
    });

    const opacity = this.opacityAnimated.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const scale = this.growAnimated.interpolate({
      inputRange: [0, 1],
      outputRange: [1.2, 0.8],
    });

    return (
      <Animated.View
        style={[
          this.props.style,
          styles.wrap,
          {
            transform: [{ translateX }, { scaleX: scale }, { scaleY: scale }],
            opacity,
          },
        ]}
      >
        <View style={[styles.root, { backgroundColor: colors.lightLive }]}>
          <View style={[styles.ball, { backgroundColor: colors.live }]} />
        </View>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
  },
  root: {
    height: 40,
    width: 40,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  ball: {
    height: 20,
    width: 20,
    borderRadius: 20,
  },
});

export default withTheme(TouchHintCircle);
