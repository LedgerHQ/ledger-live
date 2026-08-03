import React from "react";
import { ContactsAddAddressFlowContent } from "@features/flow-contacts";
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

const LOCKED_STEP_OPTIONS = {
  hasBackButton: true,
  noCloseButton: true,
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
  labels,
  onBack,
  onClose,
  onContinueFromReview,
  onFinish,
}: ContactsAddAddressFlowContentViewModel): React.JSX.Element {
  const flowContentProps = {
    addressEntryProps,
    addressNameProps,
    labels,
    onContinueFromReview,
    onFinish,
  };
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
      options: LOCKED_STEP_OPTIONS,
    },
    name: {
      content: <ContactsAddAddressFlowContent {...flowContentProps} step="name" />,
      options: LOCKED_STEP_OPTIONS,
    },
    review: {
      content: <ContactsAddAddressFlowContent {...flowContentProps} step="review" />,
      options: LOCKED_STEP_OPTIONS,
    },
    success: {
      content: <ContactsAddAddressFlowContent {...flowContentProps} step="success" />,
      options: {
        ...LOCKED_STEP_OPTIONS,
        hasBackButton: false,
      },
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
