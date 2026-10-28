import React from "react";
import { ContactsAddAddressEntry } from "../AddressEntry/components/ContactsAddAddressEntry/ContactsAddAddressEntry";
import { ContactsAddAddressNameInput } from "../AddressName/components/Input/ContactsAddAddressNameInput";
import { ContactsAddAddressReview } from "../Review/ContactsAddAddressReview";
import type { ContactsAddAddressFlowContentProps } from "./ContactsAddAddressFlowContent.types";

export function ContactsAddAddressFlowContent({
  state,
  supportsDomain,
  onSanctionedAddressLearnMore,
  onAddressChange,
  onScanQrCode,
  onContinueFromAddressDetails,
  onAddressLabelChange,
  onContinueFromName,
  onContinueFromReview,
}: ContactsAddAddressFlowContentProps): React.JSX.Element | null {
  switch (state.status) {
    case "enteringAddress":
      return (
        <ContactsAddAddressEntry
          addressEntry={state.addressEntry}
          addressLabel={state.addressLabel}
          supportsDomain={supportsDomain}
          onSanctionedAddressLearnMore={onSanctionedAddressLearnMore}
          onAddressChange={onAddressChange}
          onAddressLabelChange={onAddressLabelChange}
          onConfirm={onContinueFromAddressDetails}
          onQrCodeClick={onScanQrCode}
        />
      );
    case "namingAddress":
      return (
        <ContactsAddAddressNameInput
          addressEntry={state.addressEntry}
          addressLabel={state.addressLabel}
          showConfirmedAddress={state.entryMode === "mad"}
          onAddressLabelChange={onAddressLabelChange}
          onContinue={onContinueFromName}
        />
      );
    case "confirmationRequired":
      return null;
    case "reviewingAddress":
      if (state.entryMode === "prefilled" && state.displayContext !== null) {
        return (
          <ContactsAddAddressReview
            addressEntry={state.addressEntry}
            addressLabel={state.addressLabel}
            displayContext={state.displayContext}
            onContinue={onContinueFromReview}
          />
        );
      }
      return null;
    case "success":
      return null;
  }
}
