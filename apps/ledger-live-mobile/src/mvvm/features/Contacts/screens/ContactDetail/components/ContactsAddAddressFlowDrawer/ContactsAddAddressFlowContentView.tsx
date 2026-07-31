import React from "react";
import { View } from "react-native";
import {
  ContactsAddAddressEntry,
  ContactsAddAddressPlaceholderView,
} from "@features/flow-contacts";
import {
  QueuedDrawerFlow,
  type QueuedDrawerFlowOptions,
  type QueuedDrawerFlowScreenRegistry,
} from "LLM/components/QueuedDrawerFlow";
import type { ContactsAddAddressDrawerStep } from "./types";
import type { ContactsAddAddressFlowContentViewModel } from "./useContactsAddAddressFlowContentViewModel";

const FLOW_SNAP_POINT = "92%";
const STEP_FRAME_HEIGHT = "100%";

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

function ContactsAddAddressStepFrame({ children }: React.PropsWithChildren): React.JSX.Element {
  return (
    <View testID="contacts-add-address-step-frame" style={{ height: STEP_FRAME_HEIGHT }}>
      {children}
    </View>
  );
}

export function ContactsAddAddressFlowContentView({
  addressEntryProps,
  currencyShell,
  currentStep,
  isOpen,
  labels,
  onBack,
  onClose,
  onContinueFromName,
  onContinueFromReview,
  onFinish,
}: ContactsAddAddressFlowContentViewModel): React.JSX.Element {
  const screens: QueuedDrawerFlowScreenRegistry<ContactsAddAddressDrawerStep> = {
    currency: {
      content: currencyShell.content,
      options: {
        hasBackButton: currencyShell.hasBackButton,
        enablePanDownToClose: true,
      },
    },
    address: {
      content: addressEntryProps ? (
        <ContactsAddAddressStepFrame>
          <ContactsAddAddressEntry {...addressEntryProps} />
        </ContactsAddAddressStepFrame>
      ) : null,
      options: LOCKED_STEP_OPTIONS,
    },
    name: {
      content: (
        <ContactsAddAddressStepFrame>
          <ContactsAddAddressPlaceholderView
            title={labels.name}
            buttonLabel={labels.continue}
            testID="contacts-add-address-name-screen"
            onContinue={onContinueFromName}
          />
        </ContactsAddAddressStepFrame>
      ),
      options: LOCKED_STEP_OPTIONS,
    },
    review: {
      content: (
        <ContactsAddAddressStepFrame>
          <ContactsAddAddressPlaceholderView
            title={labels.review}
            buttonLabel={labels.continue}
            testID="contacts-add-address-review-screen"
            onContinue={onContinueFromReview}
          />
        </ContactsAddAddressStepFrame>
      ),
      options: LOCKED_STEP_OPTIONS,
    },
    success: {
      content: (
        <ContactsAddAddressStepFrame>
          <ContactsAddAddressPlaceholderView
            title={labels.success}
            buttonLabel={labels.done}
            testID="contacts-add-address-success-screen"
            onContinue={onFinish}
          />
        </ContactsAddAddressStepFrame>
      ),
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
