// @flow

import React, { Component } from "react";
import { Animated, Easing } from "react-native";

type Props = {
  children: any,
  paused?: boolean,
};

class Spinning extends Component<Props> {
  spinValue = new Animated.Value(0);

  componentDidMount() {
    if (!this.props.paused) this.start();
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.paused !== this.props.paused) {
      if (this.props.paused) this.stop();
      else this.start();
    }
  }

  start = () => {
    Animated.loop(
      Animated.timing(this.spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  };

  stop = () => {
    this.spinValue.setValue(0);
  };

  render() {
    const { children } = this.props;
    const rotate = this.spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    return (
      <Animated.View style={{ transform: [{ rotate }] }}>
        {children}
      </Animated.View>
    );
  }
}

export default Spinning;
