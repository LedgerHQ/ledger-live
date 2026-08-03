import React from "react";
import { ContactsAddAddressEntry } from "./ContactsAddAddressEntry.web";
import { ContactsAddAddressNameInput } from "./AddressName/Input/ContactsAddAddressNameInput.web";
import type { ContactsAddAddressNameLabels } from "./AddressName/types";
import { ContactsAddAddressCompletion } from "./Completion/ContactsAddAddressCompletion.web";
import type {
  AddAddressCompletionLabels,
  AddAddressEntryLabels,
  AddAddressFlowState,
  AddAddressInputSource,
} from "./types";

export type AddAddressWebFlowStep = "currency" | "address" | "name" | "review" | "success";

type OpenAddAddressFlowState = Exclude<AddAddressFlowState, { status: "closed" }>;
type AddAddressFlowContentState = Exclude<OpenAddAddressFlowState, { status: "selectingCurrency" }>;

export type ContactsAddAddressFlowContentProps = Readonly<{
  state: AddAddressFlowContentState;
  entryLabels: AddAddressEntryLabels;
  nameLabels: ContactsAddAddressNameLabels;
  completionLabels: AddAddressCompletionLabels;
  onAddressChange: (address: string, inputMethod: AddAddressInputSource) => void;
  onContinueFromAddressDetails: () => void;
  onAddressLabelChange: (value: string) => void;
  onContinueFromName: () => void;
  onContinueFromReview: () => void;
  onClose: () => void;
}>;

export function resolveAddAddressWebFlowStep(
  state: OpenAddAddressFlowState,
): AddAddressWebFlowStep {
  switch (state.status) {
    case "selectingCurrency":
      return "currency";
    case "enteringAddress":
      return "address";
    case "namingAddress":
      return "name";
    case "reviewingAddress":
      return "review";
    case "success":
      return "success";
  }
}

export function shouldUseAddAddressFlowBackNavigation(state: OpenAddAddressFlowState): boolean {
  return (
    state.status === "enteringAddress" ||
    state.status === "namingAddress" ||
    state.status === "reviewingAddress"
  );
}

export function ContactsAddAddressFlowContent({
  state,
  entryLabels,
  nameLabels,
  completionLabels,
  onAddressChange,
  onContinueFromAddressDetails,
  onAddressLabelChange,
  onContinueFromName,
  onContinueFromReview,
  onClose,
}: ContactsAddAddressFlowContentProps): React.JSX.Element {
  switch (state.status) {
    case "enteringAddress":
      return (
        <ContactsAddAddressEntry
          addressEntry={state.addressEntry}
          addressLabel={state.addressLabel}
          labels={entryLabels}
          nameLabels={nameLabels}
          onAddressChange={onAddressChange}
          onAddressLabelChange={onAddressLabelChange}
          onConfirm={onContinueFromAddressDetails}
        />
      );
    case "namingAddress":
      return (
        <ContactsAddAddressNameInput
          addressEntry={state.addressEntry}
          addressLabel={state.addressLabel}
          labels={nameLabels}
          onAddressLabelChange={onAddressLabelChange}
          onContinue={onContinueFromName}
        />
      );
    case "reviewingAddress":
      return (
        <ContactsAddAddressCompletion
          buttonLabel={completionLabels.continue}
          onContinue={onContinueFromReview}
          testID="contacts-add-address-review"
          title={completionLabels.title}
        />
      );
    case "success":
      return (
        <ContactsAddAddressCompletion
          buttonLabel={completionLabels.close}
          onContinue={onClose}
          testID="contacts-add-address-success"
          title={completionLabels.successTitle}
        />
      );
  }
}
