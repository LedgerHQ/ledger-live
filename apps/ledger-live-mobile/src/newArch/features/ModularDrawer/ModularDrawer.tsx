import React from "react";
import QueuedDrawer from "~/components/QueuedDrawer";
import ModularDrawerFlowManager from "./ModularDrawerFlowManager";
import { ModularDrawerStep } from "./types";
import { useModularDrawerFlowStepManager } from "./hooks/useModularDrawerFlowStepManager";

type Props = {
  selectedStep: ModularDrawerStep;
  isOpen?: boolean;
  onClose?: () => void;
};
export function ModularDrawer({ isOpen, onClose, selectedStep }: Props) {
  const viewModel = useModularDrawerFlowStepManager({ selectedStep });

  // In prevision of tracking the back button press
  const onBackButtonPress = () => viewModel.prevStep();

  // const CustomDrawerHeader = () => <DrawerHeader onClose={handleClose} />;
  return (
    <QueuedDrawer
      isRequestingToBeOpened={isOpen}
      onClose={onClose}
      hasBackButton={viewModel.hasBackButton}
      onBack={onBackButtonPress}
      customHeader={viewModel.hasBackButton ? undefined : undefined} // TODO: Add custom header if needed
    >
      {/* TODO: Drawer Transitions & animations will be implemented here. */}
      <ModularDrawerFlowManager {...viewModel} />
    </QueuedDrawer>
  );
}
