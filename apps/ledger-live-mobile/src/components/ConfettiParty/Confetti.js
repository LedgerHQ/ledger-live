// @flow
import React, { PureComponent } from "react";
import { Animated, Easing } from "react-native";

const easing = Easing.bezier(0.0, 0.3, 1, 1);

class Confetti extends PureComponent<
  {
    shape: Function,
    initialXPercent: number,
    initialYPercent: number,
    initialRotation: number,
    initialScale: number,
    duration: number,
    rotations: number,
    delta: [number, number],
  },
  {
    progress: Animated.Value,
  },
> {
  state = {
    progress: new Animated.Value(0),
  };
  componentDidMount() {
    const { duration } = this.props;
    Animated.timing(this.state.progress, {
      toValue: 1,
      duration,
      useNativeDriver: true,
      easing,
    }).start();
  }
  render() {
    const {
      initialXPercent,
      initialYPercent,
      initialRotation,
      initialScale,
      shape,
      rotations,
      delta,
    } = this.props;
    const Shape = shape;
    const { progress } = this.state;
    const rotate = progress.interpolate({
      inputRange: [0, 1],
      // $FlowFixMe
      outputRange: ["0deg", `${rotations * 360}deg`],
    });
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      // $FlowFixMe
      outputRange: [0, delta[0]],
    });
    const translateY = progress.interpolate({
      inputRange: [0, 1],
      // $FlowFixMe
      outputRange: [0, delta[1]],
    });
    const opacity = progress.interpolate({
      inputRange: [0.6, 1],
      // $FlowFixMe
      outputRange: [1, 0],
    });

    return (
      <Animated.View
        style={{
          position: "absolute",
          left: `${(100 * initialXPercent).toFixed(0)}%`,
          top: `${(100 * initialYPercent).toFixed(0)}%`,
          opacity,
          transformOrigin: "center center",
          transform: [
            { translateX },
            { translateY },
            { scale: initialScale },
            { rotate },
          ],
        }}
      >
        <Shape style={{ rotate: initialRotation }} />
      </Animated.View>
    );
  }
}

export default Confetti;
