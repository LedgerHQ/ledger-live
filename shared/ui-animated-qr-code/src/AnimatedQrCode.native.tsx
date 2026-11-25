import React, { useCallback, useMemo } from "react";
import { Pressable } from "@ledgerhq/lumen-ui-rnative";
import { requireNativeComponent, type ViewProps } from "react-native";
import { useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { AnimatedCenter } from "./AnimatedCenter";
import { createQrMatrix } from "./qrMatrix";
import { paperStyle } from "./styles";
import { usePressCount } from "./usePressCount";
import type { AnimatedQrCodeProps, QrAnimation } from "./types";

const NATIVE_VIEW_NAME = "SharedAnimatedQrCodeView";
// Share of the clear center the badge covers, leaving a margin of white around it.
const CENTER_DIAMETER_RATIO = 0.75;
const HOLD_MS = 150;

type NativeQrCodeViewProps = ViewProps &
  Readonly<{
    animation: QrAnimation;
    /** Off when the OS asks for reduced motion: the code is drawn still. */
    animated: boolean;
    /** Each new value plays a press: the view handles no touches itself. */
    pressCount: number;
    moduleCount: number;
    // Flat [row, col, row, col, …] pairs: one array crosses to native instead of many objects.
    dots: readonly number[];
  }>;

const NativeQrCodeView = requireNativeComponent<NativeQrCodeViewProps>(NATIVE_VIEW_NAME);

/**
 * QR code whose dots and finders are drawn and animated on the native side: JS only sends the QR
 * matrix once, and a count for each press. The center badge is a React node, animated by
 * AnimatedCenter.
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
  // The skeleton has nothing to ripple.
  const playsPresses = animated && animation !== "loading";
  const { pressCount, popCount, press } = usePressCount(triggerKey, playsPresses);
  const pressable = onPress !== undefined;
  const hold = useSharedValue(0);
  const sizeStyle = { width: size, height: size };

  // The center grows on touch down and stays big while held; the ripple waits for a confirmed press,
  // so the start of a scroll over the code only grows and shrinks it back.
  const handlePressIn = useCallback(() => {
    if (playsPresses) hold.set(withTiming(1, { duration: HOLD_MS }));
  }, [playsPresses, hold]);
  const handlePressOut = useCallback(() => {
    hold.set(withTiming(0, { duration: HOLD_MS }));
  }, [hold]);
  const handlePress = useCallback(() => {
    press();
    onPress?.();
  }, [press, onPress]);

  return (
    <Pressable
      testID={testID}
      lx={paperStyle}
      style={sizeStyle}
      accessible={pressable}
      accessibilityRole={pressable ? "button" : undefined}
      accessibilityLabel={accessibilityLabel}
      onPressIn={pressable ? handlePressIn : undefined}
      onPressOut={pressable ? handlePressOut : undefined}
      onPress={handlePress}
    >
      <NativeQrCodeView
        style={sizeStyle}
        animation={animation}
        animated={animated}
        pressCount={pressCount}
        moduleCount={matrix.moduleCount}
        dots={dots}
      />
      {hasCenter && (
        <AnimatedCenter
          animation={animation}
          animated={animated}
          popCount={popCount}
          hold={hold}
          size={size}
          diameter={matrix.clearCount * (size / matrix.moduleCount) * CENTER_DIAMETER_RATIO}
        >
          {centerContent}
        </AnimatedCenter>
      )}
    </Pressable>
  );
}
