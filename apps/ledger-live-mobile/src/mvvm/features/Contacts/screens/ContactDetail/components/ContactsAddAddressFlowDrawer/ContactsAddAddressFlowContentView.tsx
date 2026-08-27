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
  addressEntryProps,
  addressNameProps,
  currencyShell,
  currentStep,
  isOpen,
  onBack,
  onClose,
  onHeaderClosePressed,
}: ContactsAddAddressFlowContentViewModel): React.JSX.Element {
  const flowContentProps = { addressEntryProps, addressNameProps };
  const screens: QueuedDrawerFlowScreenRegistry<ContactsAddAddressDrawerStep> = {
    currency: {
      content: currencyShell.content,
      options: {
        hasBackButton: currencyShell.hasBackButton,
        enablePanDownToClose: true,
      },
    },
    address: {
      content: <ContactsAddAddressFlowContent {...flowContentProps} step="address" />,
      options: { ...FORM_STEP_OPTIONS, onHeaderClosePressed },
    },
    name: {
      content: <ContactsAddAddressFlowContent {...flowContentProps} step="name" />,
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
