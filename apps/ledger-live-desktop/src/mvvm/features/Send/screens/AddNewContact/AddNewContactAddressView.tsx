import React from "react";
import { ContactsAddAddressFlowContent } from "@features/flow-contacts-add-address";
import type { AddNewContactAddressPhase } from "./hooks/useAddNewContactViewModel";

type AddNewContactAddressViewProps = Readonly<{
  addressPhase: AddNewContactAddressPhase;
}>;

export function AddNewContactAddressView({ addressPhase }: AddNewContactAddressViewProps) {
  return (
    <div
      className="flex flex-1 flex-col px-24 pb-24 pt-12"
      data-testid="send-add-new-contact-address-step"
    >
      <ContactsAddAddressFlowContent
        state={addressPhase.state}
        entryLabels={addressPhase.entryLabels}
        nameLabels={addressPhase.nameLabels}
        reviewLabels={addressPhase.reviewLabels}
        completionLabels={addressPhase.completionLabels}
        onAddressChange={() => undefined}
        onContinueFromAddressDetails={() => undefined}
        onAddressLabelChange={addressPhase.onAddressLabelChange}
        onContinueFromName={addressPhase.onContinueFromName}
        onContinueFromReview={addressPhase.onContinueFromReview}
        onCompleteMockConfirmation={() => undefined}
        onClose={() => undefined}
      />
    </div>
  );
}
