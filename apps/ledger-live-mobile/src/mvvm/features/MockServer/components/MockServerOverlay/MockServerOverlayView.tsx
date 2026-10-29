import React from "react";
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
      {isPanelOpen ? (
        <MockServerPanel connection={connection} status={status} sessionId={sessionId} />
      ) : null}
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
