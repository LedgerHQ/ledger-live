import React from "react";
import { ContactsAddAddressFlowContent } from "@features/flow-contacts-add-address";
import {
  QueuedDrawerFlow,
  type QueuedDrawerFlowOptions,
  type QueuedDrawerFlowScreenRegistry,
} from "LLM/components/QueuedDrawerFlow";
import type { ContactsAddAddressDrawerStep } from "./types";
import type { ContactsAddAddressFlowContentViewModel } from "./useContactsAddAddressFlowContentViewModel";

const FLOW_SNAP_POINT = "92%";
const FLOW_OPTIONS = {
  snapPoints: [FLOW_SNAP_POINT],
} as const satisfies QueuedDrawerFlowOptions;

const FORM_STEP_OPTIONS = {
  hasBackButton: true,
  hideHandle: true,
  preventBackdropClick: true,
  enablePanDownToClose: false,
} as const satisfies QueuedDrawerFlowOptions;

export function ContactsAddAddressFlowContentView({
  flowContentProps,
  currencyShell,
  currentStep,
  isOpen,
  onBack,
  onClose,
  onHeaderClosePressed,
}: ContactsAddAddressFlowContentViewModel): React.JSX.Element {
  const flowContent = flowContentProps ? (
    <ContactsAddAddressFlowContent {...flowContentProps} />
  ) : null;
  const screens: QueuedDrawerFlowScreenRegistry<ContactsAddAddressDrawerStep> = {
    currency: {
      content: currencyShell.content,
      options: {
        hasBackButton: currencyShell.hasBackButton,
        enablePanDownToClose: true,
      },
    },
    address: {
      content: flowContent,
      options: { ...FORM_STEP_OPTIONS, onHeaderClosePressed },
    },
    name: {
      content: flowContent,
      options: { ...FORM_STEP_OPTIONS, onHeaderClosePressed },
    },
  };

  return (
    <QueuedDrawerFlow
      currentStep={currentStep}
      defaultOptions={FLOW_OPTIONS}
      isOpen={isOpen}
      onBack={onBack}
      onClose={onClose}
      screens={screens}
      testID="contacts-add-address-flow-drawer"
    />
  );
}
