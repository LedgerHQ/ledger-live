import React from "react";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, LinearGradient } from "@ledgerhq/lumen-ui-rnative";
import type { LumenStyleSheetTheme } from "@ledgerhq/lumen-ui-rnative/styles";

export const GRADIENT_HEIGHT = 80;
export const GRADIENT_STOPS = [
  { color: "base", offset: 0, opacity: 0 },
  { color: "base", offset: 0.35, opacity: 0.3 },
  { color: "base", offset: 0.7, opacity: 0.75 },
  { color: "base", offset: 1, opacity: 1 },
] satisfies {
  color: keyof LumenStyleSheetTheme["colors"]["bg"];
  offset: number;
  opacity: number;
}[];

export function BottomFadeGradient() {
  const { bottom } = useSafeAreaInsets();
  const bottomInset = Platform.OS === "ios" ? bottom : 0;

  return (
    <Box
      testID="bottom-fade-gradient"
      pointerEvents="none"
      style={[styles.container, { height: GRADIENT_HEIGHT + bottomInset }]}
    >
      <LinearGradient
        stops={GRADIENT_STOPS}
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
