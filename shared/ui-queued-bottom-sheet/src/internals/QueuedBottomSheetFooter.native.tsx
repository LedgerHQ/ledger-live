import React, { useEffect, useState } from "react";
import { Keyboard, Platform, View, type LayoutChangeEvent } from "react-native";
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
  const keyboardOffset = useAndroidKeyboardOffset();
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
        // The keyboard covers the system bars it sits over, so the safe area owes nothing while up.
        style={{ paddingBottom: (isKeyboardOpen ? 0 : bottomInset) + FOOTER_BOTTOM_SPACING }}
      >
        {children}
      </Box>
    </View>
  );
}

/**
 * How far the footer has to rise to clear the Android keyboard.
 *
 * gorhom offsets the keyboard against the sheet container itself, which holds on iOS. On Android
 * that offset never arrives — the manifest promises `adjustResize`, so gorhom leaves the room to
 * the window — and the footer is left behind the keyboard. Lifting it by the keyboard height is
 * what the main tab bar already does for the same reason.
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
