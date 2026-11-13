import React, { useMemo } from "react";
import {
  type GestureResponderEvent,
  Pressable,
  requireNativeComponent,
  type ViewProps,
} from "react-native";
import { AnimatedCenter } from "./AnimatedCenter";
import { CENTER_DIAMETER_RATIO } from "./geometry";
import { createQrMatrix } from "./qrMatrix";
import { useQrClock } from "./useQrClock";
import type { AnimatedQrCodeProps, QrAnimation } from "./types";

const NATIVE_VIEW_NAME = "SharedAnimatedQrCodeView";

type NativeAnimatedQrCodeViewProps = ViewProps &
  Readonly<{
    animation: QrAnimation;
    autoPlay: boolean;
    moduleCount: number;
    // Flat [row, col, row, col, …] pairs: one array crosses to native instead of many objects.
    dots: readonly number[];
  }>;

const NativeView = requireNativeComponent<NativeAnimatedQrCodeViewProps>(NATIVE_VIEW_NAME);

/**
 * Dots and finders are drawn, animated and touched entirely on the native side: JS only sends the
 * QR matrix once. The center badge is a React node, animated by AnimatedCenter.
 */
export function NativeAnimatedQrCode({
  value,
  size,
  animation,
  centerContent,
  onPress,
  autoPlay = false,
  testID,
}: AnimatedQrCodeProps): React.JSX.Element {
  const matrix = useMemo(() => createQrMatrix(value), [value]);
  const dots = useMemo(() => matrix.dots.flatMap(({ row, col }) => [row, col]), [matrix]);
  const clock = useQrClock(animation, autoPlay);
  const { time, touch } = clock;

  // The native view handles its own touches; these only drive the center badge.
  const onPressIn = ({ nativeEvent }: GestureResponderEvent) =>
    touch.set({
      x: nativeEvent.locationX / size,
      y: nativeEvent.locationY / size,
      pressedAt: time.get(),
      releasedAt: -1,
    });
  const onPressOut = () => touch.set({ ...touch.get(), releasedAt: time.get() });

  return (
    <Pressable
      testID={testID}
      style={{ width: size, height: size }}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <NativeView
        style={{ width: size, height: size }}
        animation={animation}
        autoPlay={autoPlay}
        moduleCount={matrix.moduleCount}
        dots={dots}
      />
      <AnimatedCenter
        {...clock}
        animation={animation}
        size={size}
        diameter={matrix.clearCount * (size / matrix.moduleCount) * CENTER_DIAMETER_RATIO}
      >
        {centerContent}
      </AnimatedCenter>
    </Pressable>
  );
}
