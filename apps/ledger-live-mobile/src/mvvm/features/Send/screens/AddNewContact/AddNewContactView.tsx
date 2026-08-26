import React from "react";
import {
  QueuedDrawerFlow,
  type QueuedDrawerFlowOptions,
  type QueuedDrawerFlowScreenRegistry,
} from "LLM/components/QueuedDrawerFlow";
import { ContactNameStep } from "./components/ContactNameStep";
import { useAddNewContactAddressScreens } from "./hooks/useAddNewContactAddressScreens";
import type {
  AddNewContactDrawerStep,
  AddNewContactViewModel,
} from "./hooks/useAddNewContactViewModel";

const FLOW_OPTIONS = {
  snapPoints: "fullWithOffset",
} as const satisfies QueuedDrawerFlowOptions;

const CONTACT_STEP_OPTIONS = {
  enablePanDownToClose: true,
} as const satisfies QueuedDrawerFlowOptions;

export type AddNewContactViewProps = AddNewContactViewModel;

export function AddNewContactView({
  addressPhase,
  isOpeningAddressFlow: _isOpeningAddressFlow,
  keyboardBottomOffset,
  drawerStep,
  isDrawerOpen,
  onDrawerBack,
  onDrawerClose,
  ...contactDrawer
}: AddNewContactViewProps) {
  const addressScreens = useAddNewContactAddressScreens({
    addressPhase,
    bottomOffset: keyboardBottomOffset,
  });
  const screens: QueuedDrawerFlowScreenRegistry<AddNewContactDrawerStep> = {
    contact: {
      content: (
        <ContactNameStep
          {...contactDrawer}
          bottomOffset={keyboardBottomOffset}
          isVisible={isDrawerOpen}
        />
      ),
      options: CONTACT_STEP_OPTIONS,
    },
    ...addressScreens,
  };

  return (
    <QueuedDrawerFlow
      currentStep={drawerStep}
      defaultOptions={FLOW_OPTIONS}
      isOpen={isDrawerOpen}
      onBack={onDrawerBack}
      onClose={onDrawerClose}
      screens={screens}
      testID="send-add-new-contact-drawer"
    />
  );
}
