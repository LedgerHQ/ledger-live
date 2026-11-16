import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

/** Figma "Glow Bloom": 481×264 ellipse at 60% opacity, centred 36pt above the bottom edge. */
const WIDTH = 481;
const HEIGHT = 264;
const CENTER_FROM_BOTTOM = 36;

export function SetupGlow() {
  return (
    <View pointerEvents="none" style={styles.glow}>
      <Svg width={WIDTH} height={HEIGHT}>
        <Defs>
          <RadialGradient id="setupGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor="#59148C" stopOpacity={0.7} />
            <Stop offset="0.3" stopColor="#470D73" stopOpacity={0.4} />
            <Stop offset="0.6" stopColor="#2E0559" stopOpacity={0.15} />
            <Stop offset="1" stopColor="#2E0559" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Ellipse
          cx={WIDTH / 2}
          cy={HEIGHT / 2}
          rx={WIDTH / 2}
          ry={HEIGHT / 2}
          fill="url(#setupGlow)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: "absolute",
    left: "50%",
    marginLeft: -WIDTH / 2,
    bottom: CENTER_FROM_BOTTOM - HEIGHT / 2,
    opacity: 0.6,
  },
});
