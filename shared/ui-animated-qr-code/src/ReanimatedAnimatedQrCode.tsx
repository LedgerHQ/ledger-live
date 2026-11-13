import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { getQrElementFrame, INK, toRgbString, type QrElement } from "./animationTimeline";
import { AnimatedCenter } from "./AnimatedCenter";
import { CENTER_DIAMETER_RATIO, DOT_RADIUS_RATIO, FINDER_RING_RADIUS_MODULES } from "./geometry";
import {
  createQrMatrix,
  FINDER_CENTER_OFFSET,
  FINDER_MODULES,
  getModuleCenter,
  type QrMatrix,
} from "./qrMatrix";
import { type QrClock, useQrClock } from "./useQrClock";
import type { AnimatedQrCodeProps, QrAnimation } from "./types";

const INK_COLOR = toRgbString(INK);

type AnimatedElementProps = QrClock & Readonly<{ animation: QrAnimation; element: QrElement }>;

function useElementStyle(
  { time, touch, animation, element }: AnimatedElementProps,
  colorProperty: "backgroundColor" | "borderColor",
) {
  return useAnimatedStyle(() => {
    const frame = getQrElementFrame(animation, time.get(), element, touch.get());
    // Each animation only animates what it changes: the shimmer the colour, the others the scale.
    if (animation === "shimmer") return { [colorProperty]: toRgbString(frame.color) };
    return { transform: [{ scale: frame.scale }] };
  });
}

type DotProps = AnimatedElementProps & Readonly<{ left: number; top: number; diameter: number }>;

const Dot = memo(function Dot({ left, top, diameter, ...animated }: DotProps) {
  const animatedStyle = useElementStyle(animated, "backgroundColor");
  return (
    <Animated.View
      style={[
        styles.absolute,
        {
          left,
          top,
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor: INK_COLOR,
        },
        animatedStyle,
      ]}
    />
  );
});

type FinderProps = AnimatedElementProps &
  Readonly<{ left: number; top: number; moduleSize: number }>;

const Finder = memo(function Finder({ left, top, moduleSize, ...animated }: FinderProps) {
  const ringStyle = useElementStyle(animated, "borderColor");
  const innerStyle = useElementStyle(animated, "backgroundColor");
  const ringSize = FINDER_MODULES * moduleSize;
  return (
    <>
      <Animated.View
        style={[
          styles.absolute,
          {
            left,
            top,
            width: ringSize,
            height: ringSize,
            borderRadius: moduleSize * FINDER_RING_RADIUS_MODULES,
            borderWidth: moduleSize,
            borderColor: INK_COLOR,
          },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.absolute,
          {
            left: left + moduleSize * 2,
            top: top + moduleSize * 2,
            width: moduleSize * 3,
            height: moduleSize * 3,
            borderRadius: moduleSize,
            backgroundColor: INK_COLOR,
          },
          innerStyle,
        ]}
      />
    </>
  );
});

/** One Animated.View per dot; styles, clock and touch all run on the UI thread. */
export function ReanimatedAnimatedQrCode({
  value,
  size,
  animation,
  centerContent,
  onPress,
  autoPlay = false,
  testID,
}: AnimatedQrCodeProps): React.JSX.Element {
  const matrix = useMemo(() => createQrMatrix(value), [value]);
  const clock = useQrClock(animation, autoPlay);
  const { time, touch } = clock;

  // Only a press triggers an effect: the finger is not followed when it moves.
  const press = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(Number.MAX_SAFE_INTEGER)
        .onBegin(({ x, y }) => {
          touch.set({ x: x / size, y: y / size, pressedAt: time.get(), releasedAt: -1 });
        })
        .onEnd((_event, success) => {
          if (success && onPress) scheduleOnRN(onPress);
        })
        .onFinalize(() => {
          touch.set({ ...touch.get(), releasedAt: time.get() });
        }),
    [size, time, touch, onPress],
  );

  const layout = useMemo(() => getLayout(matrix, size), [matrix, size]);
  const shared = { ...clock, animation };

  return (
    <GestureDetector gesture={press}>
      <View testID={testID} style={{ width: size, height: size }}>
        {layout.dots.map(({ key, ...dot }) => (
          <Dot key={key} {...shared} {...dot} />
        ))}
        {layout.finders.map(({ key, ...finder }) => (
          <Finder key={key} {...shared} {...finder} />
        ))}
        <AnimatedCenter {...shared} size={size} diameter={layout.centerDiameter}>
          {centerContent}
        </AnimatedCenter>
      </View>
    </GestureDetector>
  );
}

// Built once per value and size: element objects stay stable so memoized views never re-render.
function getLayout({ moduleCount, dots, finders, clearCount }: QrMatrix, size: number) {
  const moduleSize = size / moduleCount;
  const dotDiameter = moduleSize * DOT_RADIUS_RATIO * 2;
  const dotInset = (moduleSize - dotDiameter) / 2;

  return {
    dots: dots.map(({ row, col }) => ({
      key: `${row}-${col}`,
      element: {
        x: getModuleCenter(col, moduleCount),
        y: getModuleCenter(row, moduleCount),
        kind: "dot",
      } satisfies QrElement,
      left: col * moduleSize + dotInset,
      top: row * moduleSize + dotInset,
      diameter: dotDiameter,
    })),
    finders: finders.map(({ row, col }) => ({
      key: `${row}-${col}`,
      element: {
        x: getModuleCenter(col + FINDER_CENTER_OFFSET, moduleCount),
        y: getModuleCenter(row + FINDER_CENTER_OFFSET, moduleCount),
        kind: "finder",
      } satisfies QrElement,
      left: col * moduleSize,
      top: row * moduleSize,
      moduleSize,
    })),
    centerDiameter: clearCount * moduleSize * CENTER_DIAMETER_RATIO,
  };
}

const styles = StyleSheet.create({
  absolute: { position: "absolute" },
});
