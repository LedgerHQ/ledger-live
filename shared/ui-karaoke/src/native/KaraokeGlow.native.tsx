import React from "react";
import Animated, { css } from "react-native-reanimated";
import { GLOW_FADE_MS } from "@shared/ui-glow/native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

/** Measured on the design: an ellipse centered on the screen edge, wider than the screen. */
const RADIUS_X = 520;
const RADIUS_Y = 460;
/** The top glow is shorter, like the GPU one (`topReach`). */
const TOP_SCALE_Y = 0.65;
/** Color and opacity by distance from the edge, as a share of RADIUS_Y. The tail gets bluer. */
const FALLOFF = [
  { offset: 0, color: "#44345F", opacity: 1 },
  { offset: 0.28, color: "#44345F", opacity: 1 },
  { offset: 0.36, color: "#44345F", opacity: 0.8 },
  { offset: 0.48, color: "#45326F", opacity: 0.48 },
  { offset: 0.6, color: "#452A77", opacity: 0.26 },
  { offset: 0.72, color: "#472480", opacity: 0.14 },
  { offset: 0.84, color: "#472480", opacity: 0.05 },
  { offset: 1, color: "#472480", opacity: 0 },
] as const;

type KaraokeGlowProps = Readonly<{ isAtBottom: boolean; delayMs: number }>;

/** Static fallback of the GPU glow (@shared/ui-glow), when the shader cannot run. Same crossfade. */
export function KaraokeGlow({ isAtBottom, delayMs }: KaraokeGlowProps) {
  return (
    <>
      <EdgeGlow position="top" isVisible={!isAtBottom} delayMs={delayMs} />
      <EdgeGlow position="bottom" isVisible={isAtBottom} delayMs={delayMs} />
    </>
  );
}

type EdgeGlowProps = Readonly<{ position: "top" | "bottom"; isVisible: boolean; delayMs: number }>;

function EdgeGlow({ position, isVisible, delayMs }: EdgeGlowProps) {
  const radiusY = position === "top" ? RADIUS_Y * TOP_SCALE_Y : RADIUS_Y;
  const edge = { [position]: -radiusY };
  const fade = { opacity: isVisible ? 1 : 0, transitionDelay: delayMs };
  return (
    <Animated.View pointerEvents="none" style={[styles.glow, edge, fade]}>
      <Svg width={RADIUS_X * 2} height={radiusY * 2}>
        <Defs>
          <RadialGradient id="karaokeGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            {FALLOFF.map(({ offset, color, opacity }) => (
              <Stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
            ))}
          </RadialGradient>
        </Defs>
        <Ellipse cx={RADIUS_X} cy={radiusY} rx={RADIUS_X} ry={radiusY} fill="url(#karaokeGlow)" />
      </Svg>
    </Animated.View>
  );
}

const styles = css.create({
  glow: {
    position: "absolute",
    left: "50%",
    marginLeft: -RADIUS_X,
    transitionProperty: "opacity",
    transitionDuration: GLOW_FADE_MS,
    transitionTimingFunction: "ease-in-out",
  },
});
