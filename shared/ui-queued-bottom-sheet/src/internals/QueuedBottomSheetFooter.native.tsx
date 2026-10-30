import React, { useEffect, useRef, useState } from "react";
import { Keyboard, Platform, View, type LayoutChangeEvent } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FOOTER_BOTTOM_SPACING = 16;
const FOOTER_POSITION_SAMPLE_FRAMES = 20;

type QueuedBottomSheetFooterProps = Readonly<{
  children: React.ReactNode;
  onHeightChange: (height: number) => void;
}>;

/**
 * Chrome around a sheet footer: the sheet background, the content's horizontal padding and the
 * bottom safe area.
 *
 * Lumen's own `BottomSheetFooter` cannot be used here. gorhom renders the footer as a sibling of
 * the sheet children, outside the Lumen provider that component requires.
 */
export function QueuedBottomSheetFooter({
  children,
  onHeightChange,
}: QueuedBottomSheetFooterProps): React.JSX.Element {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const unliftedFooterRef = useRef<View>(null);
  const keyboardOffset = useAndroidKeyboardOffset() + useIosKeyboardOffset(unliftedFooterRef);

  const handleLayout = (event: LayoutChangeEvent) => {
    onHeightChange(event.nativeEvent.layout.height);
  };

  return (
    // The outer frame stays where the sheet put it. The lift is on the child, so a later measurement
    // still sees the sheet position and does not count this translation again.
    <View ref={unliftedFooterRef} onLayout={handleLayout}>
      <View style={{ transform: [{ translateY: keyboardOffset === 0 ? 0 : -keyboardOffset }] }}>
        <Box
          lx={{
            backgroundColor: "canvasSheet",
            gap: "s8",
            paddingHorizontal: "s16",
            paddingTop: "s12",
          }}
          // Kept while the keyboard is up: Android reports a keyboard height that stops short of the
          // system bars, and expects this padding to cover the rest.
          style={{ paddingBottom: bottomInset + FOOTER_BOTTOM_SPACING }}
        >
          {children}
        </Box>
      </View>
    </View>
  );
}

/**
 * How far the footer has to rise to clear the Android keyboard.
 *
 * On Android that offset never arrives — the manifest promises `adjustResize`, so gorhom leaves
 * the room to the window — and the footer is left behind the keyboard. Lifting it by the keyboard
 * height is what the main tab bar already does for the same reason.
 *
 * The height Android reports is `imeInsets.bottom - systemBarInsets.bottom` (see RN's
 * `ReactRootView`), so it only reaches the top of the system bars. The footer's own bottom safe
 * area covers the remainder.
 */
function useAndroidKeyboardOffset(): number {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const shown = Keyboard.addListener("keyboardDidShow", event => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hidden = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  return keyboardHeight;
}

function useIosKeyboardOffset(footerRef: React.RefObject<View | null>): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    let generation = 0;
    const sampler = createFooterLiftSampler(keyboardTop => {
      const measuredGeneration = generation;
      footerRef.current?.measureInWindow((_x, y, _width, height) => {
        if (measuredGeneration !== generation) return;
        setOffset(liftAboveKeyboard({ y, height }, keyboardTop));
      });
    });

    const onShow = (event?: { endCoordinates?: { height?: number; screenY?: number } }) => {
      const top = keyboardTop(event);
      if (top === null) return;
      sampler.schedule(top);
    };
    const onHide = () => {
      generation += 1;
      sampler.stop();
      setOffset(0);
    };

    onShow();
    const willShow = Keyboard.addListener("keyboardWillShow", onShow);
    const didShow = Keyboard.addListener("keyboardDidShow", onShow);
    const hidden = Keyboard.addListener("keyboardWillHide", onHide);

    return () => {
      generation += 1;
      sampler.stop();
      willShow.remove();
      didShow.remove();
      hidden.remove();
    };
  }, [footerRef]);

  return offset;
}

function keyboardTop(event?: {
  endCoordinates?: { height?: number; screenY?: number };
}): number | null {
  const metrics = Keyboard.metrics?.();
  const height = event?.endCoordinates?.height ?? metrics?.height ?? 0;
  if (height <= 0) return null;
  const screenY = event?.endCoordinates?.screenY ?? metrics?.screenY;
  if (typeof screenY !== "number") return null;
  return screenY;
}

function liftAboveKeyboard(footer: { y: number; height: number }, keyboardTop: number): number {
  const footerBottom = footer.y + footer.height;
  return Math.max(0, footerBottom - keyboardTop);
}

function createFooterLiftSampler(apply: (keyboardTop: number) => void) {
  let generation = 0;
  let frame = 0;
  let top = 0;

  const stop = () => {
    generation += 1;
    cancelScheduledFrame(frame);
    frame = 0;
  };

  const schedule = (keyboardTop: number) => {
    stop();
    top = keyboardTop;
    const current = generation;
    apply(top);
    let remaining = FOOTER_POSITION_SAMPLE_FRAMES;
    const step = () => {
      if (generation !== current || remaining === 0) return;
      remaining -= 1;
      apply(top);
      frame = scheduleFrame(step);
    };
    frame = scheduleFrame(step);
  };

  return { schedule, stop };
}

function scheduleFrame(callback: () => void): number {
  if (typeof requestAnimationFrame !== "function") return 0;
  return requestAnimationFrame(callback);
}

function cancelScheduledFrame(frame: number) {
  if (frame !== 0 && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
}
