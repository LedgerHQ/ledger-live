import React from "react";
import QueuedDrawer from "~/components/QueuedDrawer";
import ModularDrawerFlowManager from "./ModularDrawerFlowManager";
import { ModularDrawerStep } from "./types";

type Props = {
  isOpen?: boolean;
  onClose?: () => void;
  selectedStep?: ModularDrawerStep;
};
export function ModularDrawer({ isOpen, onClose, selectedStep }: Props) {
  return (
    <QueuedDrawer isRequestingToBeOpened={isOpen} onClose={onClose}>
      {/* TODO: Drawer Transitions & animations will be implemented here. */}
      <ModularDrawerFlowManager selectedStep={selectedStep} />
    </QueuedDrawer>
  );
}
