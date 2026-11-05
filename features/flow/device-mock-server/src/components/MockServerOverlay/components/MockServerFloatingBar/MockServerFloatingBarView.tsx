import React from "react";
import { Animated, StyleSheet, View } from "react-native";
import { DeviceScreenFrame } from "./DeviceScreenFrame";
import { MockServerBarButtons } from "./MockServerBarButtons";
import {
  DEVICE_SCREEN_GAP,
  type MockServerFloatingBarViewModel,
} from "./useMockServerFloatingBarViewModel";

export function MockServerFloatingBarView({
  status,
  colorScheme,
  devices,
  zIndex,
  selectedDeviceId,
  onPressMain,
  onPressDevice,
  deviceScreen,
  translateX,
  translateY,
  dragHandlers,
  hasDeviceScreen,
  isDeviceScreenAbove,
  shownDeviceScreenWidth,
  isResizing,
  resizeHandlers,
  onDeviceScreenLayout,
}: Readonly<MockServerFloatingBarViewModel>) {
  return (
    <Animated.View
      style={[
        styles.wrap,
        { zIndex },
        isDeviceScreenAbove && styles.deviceScreenAbove,
        { transform: [{ translateX }, { translateY }] },
      ]}
    >
      <View {...dragHandlers}>
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
          resizeHandlers={resizeHandlers}
          onLayout={onDeviceScreenLayout}
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
