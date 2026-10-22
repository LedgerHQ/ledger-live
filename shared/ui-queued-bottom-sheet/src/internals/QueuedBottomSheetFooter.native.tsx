import React, { useEffect, useRef, useState } from "react";
import { Keyboard, Platform, View, type LayoutChangeEvent } from "react-native";
import { KEYBOARD_STATUS, useBottomSheetInternal } from "@gorhom/bottom-sheet";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FOOTER_BOTTOM_SPACING = 16;

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
  const keyboardOffset = useAndroidKeyboardOffset() + useIosKeyboardOffset();
  const isKeyboardOpen = keyboardOffset > 0;

  const handleLayout = (event: LayoutChangeEvent) => {
    onHeightChange(event.nativeEvent.layout.height);
  };

  return (
    // Transformed rather than padded, so lifting the footer leaves the height the sheet content
    // reserves for it alone.
    <View
      onLayout={handleLayout}
      style={{ transform: [{ translateY: isKeyboardOpen ? -keyboardOffset : 0 }] }}
    >
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
  );
}

const GORHOM_CATCH_UP_FRAMES = 4;

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

/**
 * How far the iOS footer still has to rise after gorhom's own keyboard offset.
 *
 * A keyboard that opens for this sheet is already subtracted from the footer. A keyboard that was
 * already open when the sheet mounted never delivers a show event here, so that subtraction stays
 * 0. This closes only the gap gorhom left.
 */
function useIosKeyboardOffset(): number {
  const bottomSheet = useBottomSheetInternal(true);
  const bottomSheetRef = useRef(bottomSheet);
  bottomSheetRef.current = bottomSheet;
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    let cancelled = false;
    let frame = 0;
    let generation = 0;

    const stopSampling = () => {
      generation += 1;
      cancelScheduledFrame(frame);
      frame = 0;
    };

    const apply = (current: number) => {
      if (cancelled || generation !== current) return;
      setOffset(iosKeyboardGap(bottomSheetRef.current));
    };

    const watchGorhomCatchUp = () => {
      stopSampling();
      const current = generation;
      apply(current);
      let remaining = GORHOM_CATCH_UP_FRAMES;
      const step = () => {
        if (cancelled || generation !== current || remaining === 0) return;
        remaining -= 1;
        apply(current);
        if (generation !== current) return;
        frame = scheduleFrame(step);
      };
      frame = scheduleFrame(step);
    };

    watchGorhomCatchUp();
    const shown = Keyboard.addListener("keyboardWillShow", watchGorhomCatchUp);
    const hidden = Keyboard.addListener("keyboardWillHide", () => {
      stopSampling();
      setOffset(0);
    });

    return () => {
      cancelled = true;
      stopSampling();
      shown.remove();
      hidden.remove();
    };
  }, []);

  return offset;
}

function iosKeyboardGap(bottomSheet: ReturnType<typeof useBottomSheetInternal>): number {
  const keyboardHeight = Keyboard.metrics?.()?.height ?? 0;
  return Math.max(0, keyboardHeight - gorhomCoveredHeight(bottomSheet));
}

function gorhomCoveredHeight(bottomSheet: ReturnType<typeof useBottomSheetInternal>): number {
  if (bottomSheet === null) return 0;

  const { status, heightWithinContainer } = bottomSheet.animatedKeyboardState.get();
  if (status !== KEYBOARD_STATUS.SHOWN) return 0;
  return heightWithinContainer;
}

function scheduleFrame(callback: () => void): number {
  if (typeof requestAnimationFrame !== "function") return 0;
  return requestAnimationFrame(callback);
}

function cancelScheduledFrame(frame: number) {
  if (frame !== 0 && typeof cancelAnimationFrame === "function") cancelAnimationFrame(frame);
}
