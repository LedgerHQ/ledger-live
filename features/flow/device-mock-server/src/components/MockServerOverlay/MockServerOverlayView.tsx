import React from "react";
import { StyleSheet, View } from "react-native";
import { MockServerDevice } from "@ledgerhq/device-mockserver-react-native";
import { MockServerFloatingBar } from "./components/MockServerFloatingBar/MockServerFloatingBar";
import { MockServerPanel } from "./components/MockServerPanel/MockServerPanel";
import { MockServerOverlayContainer } from "./MockServerOverlayContainer";
import type { MockServerOverlayViewModel } from "./useMockServerOverlayViewModel";

const styles = StyleSheet.create({
  panelLayer: StyleSheet.absoluteFill,
  panel: StyleSheet.absoluteFill,
  hiddenPanel: { display: "none" },
});

export function MockServerOverlayView({
  config,
  status,
  devices,
  colorScheme,
  zIndex,
  selectedDevice,
  deviceScreenWidth,
  isPanelOpen,
  isPanelMounted,
  isFloatingButtonHidden,
  sessionImport,
  seed,
  onApply,
  onOpenSettings,
  onSaveKnownDevices,
  onPressMain,
  onPressDevice,
  onResizeDeviceScreen,
}: Readonly<MockServerOverlayViewModel>) {
  if (!config) return null;

  return (
    <MockServerOverlayContainer>
      {/* Always mounted: iOS stacks later children on top, so a late panel would cover the bar */}
      <View
        style={[styles.panelLayer, { zIndex: zIndex - 1 }]}
        pointerEvents="box-none"
        collapsable={false}
      >
        {isPanelMounted ? (
          <View style={isPanelOpen ? styles.panel : styles.hiddenPanel}>
            <MockServerPanel
              config={config}
              status={status}
              sessionImport={sessionImport}
              seed={seed}
              onApply={onApply}
              onOpenSettings={onOpenSettings}
              onSaveKnownDevices={onSaveKnownDevices}
            />
          </View>
        ) : null}
      </View>
      {isFloatingButtonHidden ? null : (
        <MockServerFloatingBar
          status={status}
          devices={devices}
          colorScheme={colorScheme}
          zIndex={zIndex}
          selectedDeviceId={selectedDevice?.id ?? null}
          onPressMain={onPressMain}
          onPressDevice={onPressDevice}
          deviceScreenWidth={deviceScreenWidth}
          onResizeDeviceScreen={onResizeDeviceScreen}
          deviceScreen={
            selectedDevice ? (
              <MockServerDevice
                key={selectedDevice.id}
                url={config.url}
                token={config.token}
                deviceId={selectedDevice.id}
                colorScheme={colorScheme}
              />
            ) : null
          }
        />
      )}
    </MockServerOverlayContainer>
  );
}
