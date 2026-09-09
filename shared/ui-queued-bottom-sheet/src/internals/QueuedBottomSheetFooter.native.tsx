import React from "react";
import { View, type LayoutChangeEvent } from "react-native";
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

  const handleLayout = (event: LayoutChangeEvent) => {
    onHeightChange(event.nativeEvent.layout.height);
  };

  return (
    <View onLayout={handleLayout}>
      <Box
        lx={{
          backgroundColor: "canvasSheet",
          gap: "s8",
          paddingHorizontal: "s16",
          paddingTop: "s12",
        }}
        style={{ paddingBottom: bottomInset + FOOTER_BOTTOM_SPACING }}
      >
        {children}
      </Box>
    </View>
  );
}
