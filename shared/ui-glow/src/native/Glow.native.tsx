import React, { useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { GlowProps } from "../Glow.types";
import { GLOW_DEFAULTS, toUniformArray } from "../glowParams";
import { GLOW_GLSL } from "../shaders/glow.glsl";
import { GLOW_METAL } from "../shaders/glow.metal";
import GlowView from "./specs/GlowViewNativeComponent";

const SOURCE = Platform.OS === "ios" ? GLOW_METAL : GLOW_GLSL;

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
  const uniforms = useMemo(() => toUniformArray({ ...GLOW_DEFAULTS, ...params }), [params]);

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
      source={SOURCE}
      params={uniforms}
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
