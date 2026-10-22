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

  const { state } = addressPhase;

  return {
    name: {
      content: (
        <ContactsAddAddressFlowContent
          addressEntryProps={null}
          addressNameProps={{
            addressLabel: state.addressLabel,
            bottomOffset,
            onChangeText: addressPhase.onAddressLabelChange,
            onContinue: addressPhase.onContinueFromName,
          }}
          addressReviewProps={null}
          step="name"
        />
      ),
      options: LOCKED_STEP_OPTIONS,
    },
    review: {
      content: (
        <ContactsAddAddressFlowContent
          addressEntryProps={null}
          addressNameProps={null}
          addressReviewProps={{
            address: state.addressEntry.resolvedAddress,
            currency: state.displayContext.assetDisplayName,
            network: state.displayContext.network.displayName,
            name: state.addressLabel.label ?? state.addressLabel.value,
            bottomOffset,
            onContinue: addressPhase.onContinueFromReview,
          }}
          step="review"
        />
      ),
      options: LOCKED_STEP_OPTIONS,
    },
  };
}
