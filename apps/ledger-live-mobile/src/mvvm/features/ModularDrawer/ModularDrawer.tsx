import React from "react";
import QueuedBottomSheet from "LLM/components/QueuedDrawer/QueuedBottomSheet";
import { ModularDrawerFlow, type ModularDrawerFlowProps } from "./ModularDrawerFlow";

const SNAP_POINTS = ["70%", "92%"];

/**
 * Props for the ModularDrawer component.
 */
export type ModularDrawerProps = Omit<ModularDrawerFlowProps, "children">;

/**
 * ModularDrawer is a generic drawer component for asset/network selection flows.
 * Handles navigation steps, asset/network selection, and drawer state.
 */
export function ModularDrawer(props: ModularDrawerProps) {
  return (
    <ModularDrawerFlow {...props}>
      {({ content, hasBackButton, isRequestingToBeOpened, onBack, onClose }) => (
        <QueuedBottomSheet
          isRequestingToBeOpened={isRequestingToBeOpened}
          onClose={onClose}
          enableBlurKeyboardOnGesture={true}
          snapPoints={SNAP_POINTS}
          hasBackButton={hasBackButton}
          onBack={onBack}
          enablePanDownToClose
        >
          {content}
        </QueuedBottomSheet>
      )}
    </ModularDrawerFlow>
  );
}
