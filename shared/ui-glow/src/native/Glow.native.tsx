import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import type { GlowProps } from "../Glow.types";
import { GLOW_DEFAULTS } from "../glowParams";
import GlowView from "./specs/GlowViewNativeComponent";

/**
 * Animated GPU glows, top and bottom. The native view runs the clock, the fades and reduce motion.
 * Renders `fallback` if the shader cannot run.
 */
export function Glow({
  showTop = true,
  showBottom = false,
  delayMs = 0,
  params,
  fallback,
  testID,
}: GlowProps) {
  const [hasFailed, setHasFailed] = useState(false);
  const p = { ...GLOW_DEFAULTS, ...params };

  if (hasFailed) {
    return (
      <View pointerEvents="none" style={StyleSheet.absoluteFill} testID={testID}>
        {fallback}
      </View>
    );
  }

  return (
    <GlowView
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      testID={testID}
      glowIntensity={p.intensity}
      glowOpacity={p.opacity}
      glowGrain={p.grain}
      glowGrainSize={p.grainSize}
      glowChroma={p.chroma}
      glowSoftness={p.softness}
      glowWidth={p.width}
      glowReach={p.reach}
      glowTopReach={p.topReach}
      glowDark={p.dark}
      glowSpreadX={p.spreadX}
      glowBalance={p.balance}
      glowContrast={p.contrast}
      showTop={showTop}
      showBottom={showBottom}
      delayMs={delayMs}
      onShaderError={event => {
        console.warn(`[Glow] ${event.nativeEvent.message}`);
        setHasFailed(true);
      }}
    />
  );
}
