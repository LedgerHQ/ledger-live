// @flow

import React, { Component } from "react";
import { View, Platform, StyleSheet } from "react-native";

const computeElevationStyle = (elevation: number) =>
  Platform.OS === "android"
    ? { elevation, backgroundColor: "white" }
    : {
        shadowOpacity: 0.0015 * elevation + 0.18,
        shadowRadius: 0.54 * elevation,
        shadowOffset: {
          height: 0.6 * elevation,
        },
      };

const cache = StyleSheet.create({
  elevation_0: {},
});

export const getElevationStyle = (elevation: number) => {
  const key = `elevation_${elevation}`;
  if (cache[key]) return cache[key];
  cache[key] = StyleSheet.create({
    style: computeElevationStyle(elevation),
  }).style;
  return cache[key];
};

export default class ElevatedView extends Component<{
  elevation: number,
  children?: *,
  style?: *,
}> {
  static defaultProps = {
    elevation: 0,
  };

  render() {
    const { elevation, style, children, ...rest } = this.props;
    return (
      <View style={[getElevationStyle(elevation), style]} {...rest}>
        {children}
      </View>
    );
  }
}
