import React from "react";
import { ContactAddressPicker } from "@features/flow-pay-contact";
import { ContactsPage } from "LLM/features/Contacts";
import { TrackScreen } from "~/analytics";
import { usePaySelectContactViewModel } from "./usePaySelectContactViewModel";

export function PaySelectContactScreen() {
  const { title, onSelectContact, contactAddressPicker, trackRecipientAddressSelection } =
    usePaySelectContactViewModel();

  return (
    <>
      <ContactsPage title={title} onSelectContact={onSelectContact} />
      {trackRecipientAddressSelection && (
        <TrackScreen category="Recipient address selection" refreshSource={false} />
      )}
      <ContactAddressPicker {...contactAddressPicker} />
    </>
  );
}
