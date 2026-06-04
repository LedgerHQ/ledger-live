import React from "react";
import { StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useBottomFadeGradientViewModel } from "./useBottomFadeGradientViewModel";

export const GRADIENT_HEIGHT = 80;
export const GRADIENT_LOCATIONS: number[] = [0, 0.35, 0.7, 1];

export function BottomFadeGradient() {
  const { colors, bottomInset } = useBottomFadeGradientViewModel();

  return (
    <Box
      testID="bottom-fade-gradient"
      pointerEvents="none"
      style={[styles.container, { height: GRADIENT_HEIGHT + bottomInset }]}
    >
      <LinearGradient
        colors={colors}
        locations={GRADIENT_LOCATIONS}
        style={StyleSheet.absoluteFillObject}
        pointerEvents="none"
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
