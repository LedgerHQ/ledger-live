import React from "react";
import QueuedBottomSheet from "LLM/components/QueuedDrawer/QueuedBottomSheet";
import type { QueuedDrawerFlowProps } from "./types";

export function QueuedDrawerFlow<Step extends string>({
  currentStep,
  defaultOptions,
  isOpen,
  onBack,
  onClose,
  screens,
  testID,
}: QueuedDrawerFlowProps<Step>) {
  const currentScreen = screens[currentStep];
  const options = { ...defaultOptions, ...currentScreen.options };
  const hasBackButton = Boolean(onBack) && options.hasBackButton;

  return (
    <QueuedBottomSheet
      {...options}
      hasBackButton={hasBackButton}
      isRequestingToBeOpened={isOpen}
      onBack={onBack}
      onClose={onClose}
      testID={testID}
    >
      {currentScreen.content}
    </QueuedBottomSheet>
  );
}

export type {
  QueuedDrawerFlowOptions,
  QueuedDrawerFlowProps,
  QueuedDrawerFlowScreen,
  QueuedDrawerFlowScreenRegistry,
} from "./types";
