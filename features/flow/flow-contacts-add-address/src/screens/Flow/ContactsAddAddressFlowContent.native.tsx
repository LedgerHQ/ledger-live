import React from "react";
import { View } from "react-native";
import { ContactsAddAddressEntry } from "../AddressEntry/components/ContactsAddAddressEntry/ContactsAddAddressEntry";
import { ContactsAddAddressName } from "../AddressName/ContactsAddAddressName";
import { ContactsAddAddressReview } from "../Review/ContactsAddAddressReview";
import type { ContactsAddAddressFlowContentProps } from "./ContactsAddAddressFlowContent.types";

const STEP_FRAME_HEIGHT = "100%";

function ContactsAddAddressStepFrame({ children }: React.PropsWithChildren): React.JSX.Element {
  return (
    <View testID="contacts-add-address-step-frame" style={{ height: STEP_FRAME_HEIGHT }}>
      {children}
    </View>
  );
}

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
  bottomOffset,
}: ContactsAddAddressFlowContentProps): React.JSX.Element | null {
  switch (state.status) {
    case "enteringAddress":
      return (
        <ContactsAddAddressStepFrame>
          <ContactsAddAddressEntry
            addressEntry={state.addressEntry}
            supportsDomain={supportsDomain}
            onSanctionedAddressLearnMore={onSanctionedAddressLearnMore}
            bottomOffset={bottomOffset}
            onChangeText={onAddressChange}
            onConfirm={onContinueFromAddressDetails}
            onQrCodeClick={onScanQrCode}
          />
        </ContactsAddAddressStepFrame>
      );
    case "namingAddress":
    case "confirmationRequired":
      return (
        <ContactsAddAddressStepFrame>
          <ContactsAddAddressName
            addressLabel={state.addressLabel}
            nextStep={state.entryMode === "mad" ? "confirmation" : "review"}
            bottomOffset={bottomOffset}
            onChangeText={onAddressLabelChange}
            onContinue={onContinueFromName}
          />
        </ContactsAddAddressStepFrame>
      );
    case "reviewingAddress":
      if (state.entryMode === "prefilled" && state.displayContext !== null) {
        return (
          <ContactsAddAddressStepFrame>
            <ContactsAddAddressReview
              addressEntry={state.addressEntry}
              addressLabel={state.addressLabel}
              displayContext={state.displayContext}
              bottomOffset={bottomOffset}
              onContinue={onContinueFromReview}
            />
          </ContactsAddAddressStepFrame>
        );
      }
      return null;
    case "success":
      return null;
  }
}
