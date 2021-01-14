// @flow

import React, { PureComponent, memo } from "react";
import { View, StyleSheet, Animated } from "react-native";

import { useTheme } from "@react-navigation/native";
import IconClose from "../icons/Close";
import DeviceNanoMedium from "./DeviceNanoMedium";
import PhoneBle from "./PhoneBle";

type Props = {
  isError?: boolean,
  isAnimated?: boolean,
};

const pauseValue = 0.8;

class LeftRightDots extends PureComponent<
  {
    isAnimated?: boolean,
    color: string,
  },
  { progress: Animated.Value },
> {
  state = {
    progress: new Animated.Value(0),
  };

  componentDidMount() {
    this.sync();
  }

  componentDidUpdate(prevProps) {
    if (this.props.isAnimated !== prevProps.isAnimated) {
      this.sync();
    }
  }

  sync() {
    if (this.props.isAnimated) this.start();
    else this.state.progress.setValue(pauseValue);
  }

  start() {
    const { progress } = this.state;
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }

  render() {
    const { progress } = this.state;
    const { color } = this.props;

    const opacities = Array(5)
      .fill(null)
      .map((_, i) =>
        progress.interpolate({
          inputRange: [0, i / 7, (i + 1) / 7, (i + 2) / 7, 1],
          outputRange: [0, 0.5, 1, 0.5, 0],
          extrapolate: "clamp",
        }),
      );

    return (
      <View style={styles.dots}>
        {opacities.map((opacity, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { backgroundColor: color, opacity }]}
          />
        ))}
      </View>
    );
  }
}

function BluetoothScanning({ isAnimated, isError }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <View style={styles.body}>
        <PhoneBle />
        <LeftRightDots
          isAnimated={isAnimated}
          color={isError ? colors.alert : colors.live}
        />
        <DeviceNanoMedium />
        {isError && (
          <View style={styles.errorContainer}>
            <IconClose size={24} color={colors.alert} />
          </View>
        )}
      </View>
    </View>
  );
}

export default memo<Props>(BluetoothScanning);

const styles = StyleSheet.create({
  root: {
    position: "relative",
  },
  body: {
    flexDirection: "row",
    alignItems: "center",
  },
  dots: {
    padding: 20,
    flexDirection: "row",
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 3,
    marginRight: 7,
  },
  errorContainer: {
    position: "absolute",
    top: 24,
    left: 70,
    width: 20,
    height: 20,
  },
});
