import React from "react";
import { View } from "react-native";
import Svg, { Defs, Path, RadialGradient, Stop } from "react-native-svg";
import { HALFTONE_LEFT_PATH } from "./assets/halftoneLeftPath";
import { HALFTONE_RIGHT_PATH } from "./assets/halftoneRightPath";

const FILL_OPACITY = 0.6;

/**
 * Each halftone is a single path of 942 dots filled with a radial gradient. The source SVGs
 * declare the gradient as cx/cy/r = 0/0/1 plus a translate+scale, which collapses into the
 * center and radius below because the scale is uniform.
 */
const HALFTONES = {
  left: {
    path: HALFTONE_LEFT_PATH,
    viewBox: "0 0 274.81 274.78",
    gradient: { cx: 137.41, cy: 137.01, r: 139.13 },
    stops: [
      { offset: 0, color: "#EE713D", opacity: 1 },
      { offset: 0.18, color: "#EE7042", opacity: 1 },
      { offset: 0.6, color: "#96FA00", opacity: 1 },
      { offset: 1, color: "#96FA00", opacity: 0 },
    ],
    layout: { top: "30.37%", left: "-37.54%", width: "80.59%", height: "143.84%" },
  },
  right: {
    path: HALFTONE_RIGHT_PATH,
    viewBox: "0 0 264 264",
    gradient: { cx: 132.011, cy: 131.638, r: 133.66 },
    stops: [
      { offset: 0, color: "#EE713D", opacity: 1 },
      { offset: 0.26, color: "#EE7042", opacity: 1 },
      { offset: 0.39, color: "#FB6EBE", opacity: 1 },
      { offset: 0.53, color: "#96FA00", opacity: 1 },
      { offset: 0.67, color: "#96FA00", opacity: 0.68 },
      { offset: 0.83, color: "#96FA00", opacity: 0.32 },
      { offset: 0.95, color: "#96FA00", opacity: 0.09 },
      { offset: 1, color: "#96FA00", opacity: 0 },
    ],
    layout: { top: "-56.54%", left: "79.52%", width: "77.41%", height: "138.21%" },
  },
} as const;

type HalftoneProps = {
  variant: keyof typeof HALFTONES;
};

export function Halftone({ variant }: HalftoneProps) {
  const { path, viewBox, gradient, stops, layout } = HALFTONES[variant];
  const gradientId = `card-halftone-${variant}`;

  return (
    <View
      testID={`card-artwork-halftone-${variant}`}
      style={{ position: "absolute", ...layout }}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="none">
        <Defs>
          <RadialGradient id={gradientId} gradientUnits="userSpaceOnUse" {...gradient}>
            {stops.map(stop => (
              <Stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
                stopOpacity={stop.opacity}
              />
            ))}
          </RadialGradient>
        </Defs>
        <Path d={path} fill={`url(#${gradientId})`} fillOpacity={FILL_OPACITY} />
      </Svg>
    </View>
  );
}
