import React from "react";
import { ContactsAddAddressFlowContent } from "@features/flow-contacts-add-address";
import type {
  QueuedDrawerFlowOptions,
  QueuedDrawerFlowScreen,
} from "LLM/components/QueuedDrawerFlow";
import type { SendPrefillAddAddressPhase } from "LLM/features/Send/hooks/useSendPrefillAddAddressFlow";

const LOCKED_STEP_OPTIONS = {
  hasBackButton: true,
  noCloseButton: true,
  hideHandle: true,
  preventBackdropClick: true,
  enablePanDownToClose: false,
} as const satisfies QueuedDrawerFlowOptions;

type UseAddNewContactAddressScreensOptions = Readonly<{
  addressPhase: SendPrefillAddAddressPhase | null;
  bottomOffset: number;
}>;

export type AddNewContactAddressScreens = Readonly<{
  name: QueuedDrawerFlowScreen;
  review: QueuedDrawerFlowScreen;
}>;

function ignoreAddressEntry(): void {
  // Send prefills the address, so the flow never shows the address entry step.
}

export function useAddNewContactAddressScreens({
  addressPhase,
  bottomOffset,
}: UseAddNewContactAddressScreensOptions): AddNewContactAddressScreens {
  if (addressPhase === null) {
    return {
      name: { content: null, options: LOCKED_STEP_OPTIONS },
      review: { content: null, options: LOCKED_STEP_OPTIONS },
    };
  }

  const content = (
    <ContactsAddAddressFlowContent
      state={addressPhase.state}
      supportsDomain={false}
      onAddressChange={ignoreAddressEntry}
      onContinueFromAddressDetails={ignoreAddressEntry}
      onAddressLabelChange={addressPhase.onAddressLabelChange}
      onContinueFromName={addressPhase.onContinueFromName}
      onContinueFromReview={addressPhase.onContinueFromReview}
      bottomOffset={bottomOffset}
    />
  );

  return {
    name: { content, options: LOCKED_STEP_OPTIONS },
    review: { content, options: LOCKED_STEP_OPTIONS },
  };
}
