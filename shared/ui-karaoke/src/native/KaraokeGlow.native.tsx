import React from "react";
import Animated, { css } from "react-native-reanimated";
import { GLOW_FADE_MS } from "@shared/ui-glow/native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

/** GPU glow size: bigger than the playground defaults; the top glow is shorter, behind the phrases. */
export const KARAOKE_GLOW_SIZE = { reach: 0.3, width: 1, topReach: 0.65 };
export const KARAOKE_ACTION_GLOW_SIZE = { reach: 0.2, width: 1, topReach: 0.975 };

/** Measured on the design: an ellipse centered on the screen edge, wider than the screen. */
const RADIUS_X = 520;
const RADIUS_Y = 460;
/** The top glow is shorter, like the GPU one. */
const TOP_SCALE_Y = KARAOKE_GLOW_SIZE.topReach;
/** Color and opacity by distance from the edge, as a share of RADIUS_Y. The tail gets bluer. */
const DARK_FALLOFF = [
  { offset: 0, color: "#44345F", opacity: 1 },
  { offset: 0.28, color: "#44345F", opacity: 1 },
  { offset: 0.36, color: "#44345F", opacity: 0.8 },
  { offset: 0.48, color: "#45326F", opacity: 0.48 },
  { offset: 0.6, color: "#452A77", opacity: 0.26 },
  { offset: 0.72, color: "#472480", opacity: 0.14 },
  { offset: 0.84, color: "#472480", opacity: 0.05 },
  { offset: 1, color: "#472480", opacity: 0 },
] as const;
const LIGHT_FALLOFF = [
  { offset: 0, color: "#D4A0FF", opacity: 0.25 },
  { offset: 0.3, color: "#D4A0FF", opacity: 0.14 },
  { offset: 0.6, color: "#D4A0FF", opacity: 0.05 },
  { offset: 1, color: "#D4A0FF", opacity: 0 },
] as const;

type Falloff = typeof DARK_FALLOFF | typeof LIGHT_FALLOFF;

type KaraokeGlowProps = Readonly<{
  isAtBottom: boolean;
  delayMs: number;
  isLight: boolean;
  hasAction: boolean;
}>;

/** Static fallback of the GPU glow (@shared/ui-glow), when the shader cannot run. Same crossfade. */
export function KaraokeGlow({ isAtBottom, delayMs, isLight, hasAction }: KaraokeGlowProps) {
  const falloff = isLight ? LIGHT_FALLOFF : DARK_FALLOFF;
  const bottomScaleY = hasAction ? 2 / 3 : 1;
  return (
    <>
      <EdgeGlow
        position="top"
        scaleY={TOP_SCALE_Y}
        isVisible={!isAtBottom}
        delayMs={delayMs}
        falloff={falloff}
      />
      <EdgeGlow
        position="bottom"
        scaleY={bottomScaleY}
        isVisible={isAtBottom}
        delayMs={delayMs}
        falloff={falloff}
      />
    </>
  );
}

type EdgeGlowProps = Readonly<{
  position: "top" | "bottom";
  scaleY: number;
  isVisible: boolean;
  delayMs: number;
  falloff: Falloff;
}>;

function EdgeGlow({ position, scaleY, isVisible, delayMs, falloff }: EdgeGlowProps) {
  const radiusY = RADIUS_Y * scaleY;
  const edge = { [position]: -radiusY };
  const fade = { opacity: isVisible ? 1 : 0, transitionDelay: delayMs };
  return (
    <Animated.View pointerEvents="none" style={[styles.glow, edge, fade]}>
      <Svg width={RADIUS_X * 2} height={radiusY * 2}>
        <Defs>
          <RadialGradient id="karaokeGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            {falloff.map(({ offset, color, opacity }) => (
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
