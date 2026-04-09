import React, { useId, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";

const RADIAL_CX = "0.5047";
const RADIAL_CY = "0.0014";
const RADIAL_RX = "0.4356";
const RADIAL_RY = "0.3306";

const OUTER_STOP_OPACITY = 0.1;
const GRADIENT_RECT_FILL_OPACITY = 0.3;

export function AnalyticsConsentSheetBackgroundGradient() {
  const reactId = useId();
  const gradientId = useMemo(() => `analyticsConsentSheetRadial${reactId.replace(/:/g, "")}`, [reactId]);
  const { theme, colorScheme } = useTheme();
  const mutedStrong = theme.colors.bg.mutedStrong;
  const outerStop = colorScheme === "light" ? theme.colors.bg.black : theme.colors.bg.white;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" collapsable={false}>
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <RadialGradient
            id={gradientId}
            gradientUnits="objectBoundingBox"
            cx={RADIAL_CX}
            cy={RADIAL_CY}
            rx={RADIAL_RX}
            ry={RADIAL_RY}
            fx={RADIAL_CX}
            fy={RADIAL_CY}
          >
            <Stop offset="0" stopColor={mutedStrong} stopOpacity={1} />
            <Stop offset="1" stopColor={outerStop} stopOpacity={OUTER_STOP_OPACITY} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${gradientId})`} fillOpacity={GRADIENT_RECT_FILL_OPACITY} />
      </Svg>
    </View>
  );
}
