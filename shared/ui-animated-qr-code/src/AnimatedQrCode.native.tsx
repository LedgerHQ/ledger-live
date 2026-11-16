import React, { useMemo } from "react";
import { Pressable, requireNativeComponent, type ViewProps } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { AnimatedCenter } from "./AnimatedCenter";
import { createQrMatrix } from "./qrMatrix";
import { useQrClock } from "./useQrClock";
import type { AnimatedQrCodeProps, QrAnimation } from "./types";

const NATIVE_VIEW_NAME = "SharedAnimatedQrCodeView";
// Share of the clear center the badge covers, leaving a margin of white around it.
const CENTER_DIAMETER_RATIO = 0.75;

type NativeQrCodeViewProps = ViewProps &
  Readonly<{
    animation: QrAnimation;
    /** Off when the OS asks for reduced motion: the code is drawn still. */
    animated: boolean;
    /** Each new value plays a press, e.g. from a separate button. */
    pressCount: number;
    moduleCount: number;
    // Flat [row, col, row, col, …] pairs: one array crosses to native instead of many objects.
    dots: readonly number[];
  }>;

const NativeQrCodeView = requireNativeComponent<NativeQrCodeViewProps>(NATIVE_VIEW_NAME);

/**
 * QR code whose dots and finders are drawn, animated and touched on the native side: JS only sends
 * the QR matrix once. The center badge is a React node, animated by AnimatedCenter.
 */
export function AnimatedQrCode({
  value,
  size,
  animation,
  centerContent,
  onPress,
  accessibilityLabel,
  triggerKey = 0,
  testID,
}: AnimatedQrCodeProps): React.JSX.Element {
  const animated = !useReducedMotion();
  const hasCenter = centerContent !== undefined && centerContent !== null;
  const matrix = useMemo(() => createQrMatrix(value, hasCenter), [value, hasCenter]);
  const dots = useMemo(() => matrix.dots.flatMap(({ row, col }) => [row, col]), [matrix]);
  const { time, pressedAt, press, pressCount } = useQrClock(triggerKey, animated);
  const pressable = onPress !== undefined;

  return (
    <Pressable
      testID={testID}
      style={{ width: size, height: size }}
      accessible={pressable}
      accessibilityRole={pressable ? "button" : undefined}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      // The native view handles its own touches; this one only drives the center content.
      onPressIn={press}
    >
      <NativeQrCodeView
        style={{ width: size, height: size }}
        animation={animation}
        animated={animated}
        pressCount={pressCount}
        moduleCount={matrix.moduleCount}
        dots={dots}
      />
      {hasCenter && (
        <AnimatedCenter
          time={time}
          pressedAt={pressedAt}
          animation={animation}
          size={size}
          diameter={matrix.clearCount * (size / matrix.moduleCount) * CENTER_DIAMETER_RATIO}
        >
          {centerContent}
        </AnimatedCenter>
      )}
    </Pressable>
  );
}
