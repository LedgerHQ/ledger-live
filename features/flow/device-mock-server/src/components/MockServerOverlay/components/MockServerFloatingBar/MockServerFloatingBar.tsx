import React, { useState } from "react";
import { Animated, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { MockServerStatus } from "../../../../useMockServerStatus";
import type { MockServerOverlayDevice } from "../../types";
import { DeviceScreenFrame } from "./DeviceScreenFrame";
import { BAR_BUTTON_SIZE, MockServerBarButtons, getBarButtonsWidth } from "./MockServerBarButtons";
import { useDraggablePosition } from "./useDraggablePosition";
import { useResizeGesture } from "./useResizeGesture";
import { clamp } from "./utils";

const DEVICE_SCREEN_GAP = 8;
const MIN_DEVICE_SCREEN_WIDTH = 120;

type Props = {
  status: MockServerStatus;
  colorScheme: "light" | "dark";
  devices: readonly MockServerOverlayDevice[];
  zIndex: number;
  selectedDeviceId: string | null;
  onPressMain: () => void;
  onPressDevice: (deviceId: string) => void;
  /** Shown under the bar, or above it when there is no room below, and dragged with it. */
  deviceScreen: React.ReactNode;
  deviceScreenWidth: number;
  onResizeDeviceScreen: (width: number) => void;
};

export function MockServerFloatingBar({
  status,
  colorScheme,
  devices,
  zIndex,
  selectedDeviceId,
  onPressMain,
  onPressDevice,
  deviceScreen,
  deviceScreenWidth,
  onResizeDeviceScreen,
}: Readonly<Props>) {
  const screen = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const hasDeviceScreen = deviceScreen !== null;
  const maxDeviceScreenWidth = screen.width - insets.left - insets.right;
  const storedDeviceScreenWidth = clamp(
    deviceScreenWidth,
    MIN_DEVICE_SCREEN_WIDTH,
    maxDeviceScreenWidth,
  );

  const resizeGesture = useResizeGesture({
    width: storedDeviceScreenWidth,
    minWidth: MIN_DEVICE_SCREEN_WIDTH,
    maxWidth: maxDeviceScreenWidth,
    onResizeEnd: onResizeDeviceScreen,
  });
  const isResizing = resizeGesture.liveWidth !== null;
  const shownDeviceScreenWidth = resizeGesture.liveWidth ?? storedDeviceScreenWidth;

  const buttonsWidth = getBarButtonsWidth(devices.length);
  const drag = useDraggablePosition({
    width: hasDeviceScreen ? Math.max(buttonsWidth, shownDeviceScreenWidth) : buttonsWidth,
    height: BAR_BUTTON_SIZE,
    initialTopOffset: 2 * BAR_BUTTON_SIZE,
  });

  const [deviceScreenHeight, setDeviceScreenHeight] = useState(0);
  const deviceScreenOffset = deviceScreenHeight + DEVICE_SCREEN_GAP;
  const fitsBelow = drag.y + deviceScreenOffset <= drag.maxY;

  const [isAboveDuringResize, setIsAboveDuringResize] = useState<boolean | null>(null);
  if (isResizing && isAboveDuringResize === null) setIsAboveDuringResize(!fitsBelow);
  if (!isResizing && isAboveDuringResize !== null) setIsAboveDuringResize(null);
  const isDeviceScreenAbove = hasDeviceScreen && (isAboveDuringResize ?? !fitsBelow);

  const translateY = isDeviceScreenAbove
    ? Animated.add(drag.translateY, -deviceScreenOffset)
    : drag.translateY;

  return (
    <Animated.View
      style={[
        styles.wrap,
        { zIndex },
        isDeviceScreenAbove && styles.deviceScreenAbove,
        { transform: [{ translateX: drag.translateX }, { translateY }] },
      ]}
    >
      <View {...drag.panHandlers}>
        <MockServerBarButtons
          status={status}
          colorScheme={colorScheme}
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onPressMain={onPressMain}
          onPressDevice={onPressDevice}
        />
      </View>
      {hasDeviceScreen ? (
        <DeviceScreenFrame
          width={shownDeviceScreenWidth}
          isResizing={isResizing}
          resizeHandlers={resizeGesture.panHandlers}
          onLayout={event => setDeviceScreenHeight(event.nativeEvent.layout.height)}
        >
          {deviceScreen}
        </DeviceScreenFrame>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0,
    left: 0,
    gap: DEVICE_SCREEN_GAP,
  },
  deviceScreenAbove: { flexDirection: "column-reverse" },
});
