import React, { memo, useMemo } from "react";
import { Dimensions, View } from "react-native";
import { Box, LinearGradient, RadialGradient } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { EdgeInsets } from "react-native-safe-area-context";

/**
 * Transcribed from Figma:
 * radial-gradient(246.98% 113.6% at 2.79% 1.25%, rgba(156, 226, 164, 0.80) 0%, rgba(0, 0, 0, 0.00) 100%),
 * linear-gradient(189deg, rgba(87, 149, 125, 0.60) -5.1%, rgba(0, 0, 0, 0.00) 92.64%)
 * Radial: green at center → theme color at edge (Lumen circular RadialGradient).
 * Linear: teal → theme base.
 */
const RADIAL_CENTER_COLOR = "rgba(156, 226, 164, 0.8)";
const LINEAR_START_COLOR = "rgba(87, 149, 125, 0.6)";

/** Linear direction: 189deg (CSS: 0° = up, clockwise) */
const LINEAR_ANGLE = 189;

function EarnBackgroundComponent() {
  const { theme } = useTheme();
  const height = useMemo(() => Dimensions.get("window").width * 1.2, []);

  const endColor = useMemo(() => theme.colors.bg.base, [theme.colors.bg.base]);

  const linearStops = useMemo(
    () => [
      { color: LINEAR_START_COLOR, offset: 0 },
      { color: endColor, offset: 0.9264 },
    ],
    [endColor],
  );

  const containerStyle = useMemo(
    (): Record<string, unknown> => ({
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      width: "100%",
      height,
      // overflow: "hidden",
    }),
    [height],
  );

  const gradientStyle = useMemo(
    (): Record<string, unknown> => ({
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%",
      height: "100%",
    }),
    [],
  );

  const args = {
    stops: [
      {
        color: RADIAL_CENTER_COLOR,
      },
      {
        color: LINEAR_START_COLOR,
        opacity: 0,
      },
    ],
    lx: {
      height: "full" as const,
      width: "full" as const,
    },
    center: { x: 0, y: 0 },
  };

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
      }}
      pointerEvents="none"
    >
      <Box style={containerStyle} pointerEvents="none">
        <LinearGradient direction={LINEAR_ANGLE} stops={linearStops} style={gradientStyle} />
        <RadialGradient {...args} />
      </Box>
    </View>
  );
}

export const EarnBackground = memo(EarnBackgroundComponent);
