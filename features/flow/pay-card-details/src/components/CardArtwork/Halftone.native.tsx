import React, { useId } from "react";
import Svg, { Defs, Path, RadialGradient, Stop } from "react-native-svg";
import { HALFTONE_LEFT_PATH, HALFTONE_RIGHT_PATH } from "./assets/halftonePaths.native";

type GradientStop = Readonly<{ offset: number; color: string; opacity?: number }>;

type HalftoneShape = Readonly<{
  path: string;
  viewBox: string;
  center: Readonly<{ x: number; y: number }>;
  radius: number;
  stops: readonly GradientStop[];
}>;

export type HalftoneSide = "left" | "right";

const SHAPES: Record<HalftoneSide, HalftoneShape> = {
  left: {
    path: HALFTONE_LEFT_PATH,
    viewBox: "0 0 274.81 274.78",
    center: { x: 137.41, y: 137.01 },
    radius: 139.13,
    stops: [
      { offset: 0, color: "#EE713D" },
      { offset: 0.18, color: "#EE7042" },
      { offset: 0.6, color: "#96FA00" },
      { offset: 1, color: "#96FA00", opacity: 0 },
    ],
  },
  right: {
    path: HALFTONE_RIGHT_PATH,
    viewBox: "0 0 264 264",
    center: { x: 132.011, y: 131.638 },
    radius: 133.659,
    stops: [
      { offset: 0, color: "#EE713D" },
      { offset: 0.26, color: "#EE7042" },
      { offset: 0.39, color: "#FB6EBE" },
      { offset: 0.53, color: "#96FA00" },
      { offset: 0.67, color: "#96FA00", opacity: 0.68 },
      { offset: 0.83, color: "#96FA00", opacity: 0.32 },
      { offset: 0.95, color: "#96FA00", opacity: 0.09 },
      { offset: 1, color: "#96FA00", opacity: 0 },
    ],
  },
};

/**
 * One of the two decorative halftone fields on the card face. The host box sets the size, and
 * `preserveAspectRatio="none"` lets the dot field stretch into it the way the web artwork does.
 */
export function Halftone({ side }: { readonly side: HalftoneSide }) {
  const gradientId = useId();
  const { path, viewBox, center, radius, stops } = SHAPES[side];

  return (
    <Svg width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="none">
      <Defs>
        <RadialGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          cx={center.x}
          cy={center.y}
          r={radius}
        >
          {stops.map(stop => (
            <Stop
              key={stop.offset}
              offset={stop.offset}
              stopColor={stop.color}
              stopOpacity={stop.opacity ?? 1}
            />
          ))}
        </RadialGradient>
      </Defs>
      <Path d={path} fill={`url(#${gradientId})`} fillOpacity={0.6} />
    </Svg>
  );
}
