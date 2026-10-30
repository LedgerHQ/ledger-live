import React from "react";
import { StyleSheet, View } from "react-native";
import { IconsLegacy } from "@ledgerhq/native-ui";
import FloatingDebugButton from "~/components/FloatingDebugButton";
import type { MockServerStatus } from "../../types";
import { MockServerPanel } from "../MockServerPanel";
import { MockServerOverlayContainer } from "./MockServerOverlayContainer";
import type { MockServerOverlayViewModel } from "./useMockServerOverlayViewModel";

const BUTTON_BACKGROUNDS: Record<MockServerStatus, string> = {
  checking: "black",
  connected: "success.c60",
  unreachable: "error.c60",
  sessionExpired: "error.c60",
};

const BUTTON_SIZE = 40;

// Above bottom sheets, and just under the floating button (zIndex 999) so it can close the panel.
const PANEL_LAYER_Z_INDEX = 998;

const styles = StyleSheet.create({
  panelLayer: { ...StyleSheet.absoluteFillObject, zIndex: PANEL_LAYER_Z_INDEX },
});

export function MockServerOverlayView({
  connection,
  status,
  sessionId,
  isPanelOpen,
  isFloatingButtonVisible,
  onToggleOpenPanel,
}: MockServerOverlayViewModel) {
  if (!connection) return null;

  return (
    <MockServerOverlayContainer>
      {/* Permanent first child: the iOS overlay appends each new child on top, so a panel
      mounted directly would cover the button */}
      <View style={styles.panelLayer} pointerEvents="box-none" collapsable={false}>
        {isPanelOpen ? (
          <MockServerPanel connection={connection} status={status} sessionId={sessionId} />
        ) : null}
      </View>
      {isFloatingButtonVisible ? (
        <FloatingDebugButton
          onPress={onToggleOpenPanel}
          Icon={IconsLegacy.ServerMedium}
          iconContainerProps={{ bg: BUTTON_BACKGROUNDS[status] }}
          testID="mock-server-floating-button"
          boxWidth={BUTTON_SIZE}
          boxHeight={BUTTON_SIZE}
        />
      ) : null}
    </MockServerOverlayContainer>
  );
}
