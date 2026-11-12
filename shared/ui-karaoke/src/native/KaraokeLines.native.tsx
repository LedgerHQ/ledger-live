import React, { useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, { Easing, Keyframe, css, cubicBezier } from "react-native-reanimated";
import { Text } from "@ledgerhq/lumen-ui-rnative";

/** Figma "Karaoke telling" curve. */
const karaokeEasing = cubicBezier(0.16, 1, 0.3, 1);
const LINE_GAP = 40;
const PAST_SCALE = 0.9;
const PAST_OPACITY = 0.5;

type KaraokeLinesProps = Readonly<{
  phrases: readonly string[];
  activeIndex: number;
}>;

export function KaraokeLines({ phrases, activeIndex }: KaraokeLinesProps) {
  const [activeCenter, setActiveCenter] = useState(0);

  const onActiveLayout = (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setActiveCenter(y + height / 2);
  };

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.column, { transform: [{ translateY: -activeCenter }] }]}>
        {phrases.slice(0, activeIndex + 1).map((phrase, index) => (
          <KaraokeLine
            key={`${index}-${phrase}`}
            text={phrase}
            isActive={index === activeIndex}
            onLayout={index === activeIndex ? onActiveLayout : undefined}
          />
        ))}
      </Animated.View>
    </View>
  );
}

type KaraokeLineProps = Readonly<{
  text: string;
  isActive: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
}>;

function KaraokeLine({ text, isActive, onLayout }: KaraokeLineProps) {
  return (
    <Animated.View entering={enterFromBelow} onLayout={onLayout}>
      <Animated.View style={[styles.focus, isActive ? styles.active : styles.past]}>
        <Text typography={isActive ? "heading3SemiBold" : "heading3"} lx={{ color: "base" }}>
          {text}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const enterFromBelow = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 30 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }], easing: Easing.bezier(0.16, 1, 0.3, 1) },
}).duration(1500);

const styles = css.create({
  column: {
    position: "absolute",
    top: "50%",
    left: 16,
    right: 16,
    gap: LINE_GAP,
    transitionProperty: "transform",
    transitionDuration: 800,
    transitionTimingFunction: karaokeEasing,
  },
  focus: {
    transformOrigin: "left center",
    transitionProperty: ["opacity", "transform"],
    transitionDuration: 800,
    transitionTimingFunction: karaokeEasing,
  },
  active: { opacity: 1, transform: [{ scale: 1 }] },
  past: { opacity: PAST_OPACITY, transform: [{ scale: PAST_SCALE }] },
});
