import React from "react";
import {
  type GestureResponderHandlers,
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";

const EDGE = 8;
const RESIZE_HANDLE_HIT_SLOP = 8;
const RESIZE_PILL_WIDTH = 6;
const RESIZE_PILL_HEIGHT = 40;

type Props = {
  width: number;
  isResizing: boolean;
  resizeHandlers: GestureResponderHandlers;
  onLayout: (event: LayoutChangeEvent) => void;
  children: React.ReactNode;
};

export function DeviceScreenFrame({
  width,
  isResizing,
  resizeHandlers,
  onLayout,
  children,
}: Readonly<Props>) {
  return (
    <Box
      testID="mock-server-device-screen"
      style={[styles.frame, { width }]}
      lx={{ backgroundColor: "mutedHover", borderRadius: "md" }}
      onLayout={onLayout}
    >
      {children}
      <View
        style={styles.resizeHandle}
        hitSlop={{ left: RESIZE_HANDLE_HIT_SLOP, right: RESIZE_HANDLE_HIT_SLOP }}
        testID="mock-server-device-screen-resize-handle"
        accessibilityLabel="Resize the device screen"
        {...resizeHandlers}
      >
        <Box
          style={styles.resizePill}
          lx={{
            backgroundColor: isResizing ? "muted" : "base",
            borderColor: "muted",
            borderRadius: "full",
          }}
        />
      </View>
    </Box>
  );
}

const styles = StyleSheet.create({
  frame: { padding: EDGE, overflow: "hidden" },
  resizeHandle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    right: 0,
    width: EDGE,
    alignItems: "center",
    justifyContent: "center",
  },
  resizePill: { width: RESIZE_PILL_WIDTH, height: RESIZE_PILL_HEIGHT, borderWidth: 1 },
});
