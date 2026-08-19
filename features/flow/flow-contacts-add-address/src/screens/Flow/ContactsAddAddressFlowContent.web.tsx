import React from "react";
import { ContactsAddAddressEntry } from "../AddressEntry/components/ContactsAddAddressEntry/ContactsAddAddressEntry";
import type { SanctionedAddressBannerProps } from "../../components/SanctionedAddressBanner/types";
import { ContactsAddAddressNameInput } from "../AddressName/components/Input/ContactsAddAddressNameInput";
import type { ContactsAddAddressNameLabels } from "../AddressName/types";
import { ContactsAddAddressCompletion } from "../Completion/ContactsAddAddressCompletion";
import type {
  AddAddressCompletionLabels,
  AddAddressEntryLabels,
  AddAddressFlowState,
  AddAddressInputSource,
} from "../../state/types";

export type AddAddressWebFlowStep = "currency" | "address" | "name" | "review" | "success";

type OpenAddAddressFlowState = Exclude<AddAddressFlowState, { status: "closed" }>;
type AddAddressFlowContentState = Exclude<OpenAddAddressFlowState, { status: "selectingCurrency" }>;

export type ContactsAddAddressFlowContentProps = Readonly<{
  state: AddAddressFlowContentState;
  entryLabels: AddAddressEntryLabels;
  sanctionedAddressBanner?: SanctionedAddressBannerProps;
  nameLabels: ContactsAddAddressNameLabels;
  completionLabels: AddAddressCompletionLabels;
  onAddressChange: (address: string, inputMethod: AddAddressInputSource) => void;
  onContinueFromAddressDetails: () => void;
  onAddressLabelChange: (value: string) => void;
  onContinueFromName: () => void;
  onContinueFromReview: () => void;
  onCompleteMockConfirmation: () => void;
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
    case "confirmationRequired":
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
    state.status === "reviewingAddress" ||
    state.status === "confirmationRequired"
  );
}

export function ContactsAddAddressFlowContent({
  state,
  entryLabels,
  sanctionedAddressBanner,
  nameLabels,
  completionLabels,
  onAddressChange,
  onContinueFromAddressDetails,
  onAddressLabelChange,
  onContinueFromName,
  onContinueFromReview,
  onCompleteMockConfirmation,
  onClose,
}: ContactsAddAddressFlowContentProps): React.JSX.Element {
  switch (state.status) {
    case "enteringAddress":
      return (
        <ContactsAddAddressEntry
          addressEntry={state.addressEntry}
          addressLabel={state.addressLabel}
          labels={entryLabels}
          sanctionedAddressBanner={sanctionedAddressBanner}
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
    case "confirmationRequired":
      return (
        <ContactsAddAddressCompletion
          buttonLabel={completionLabels.continue}
          onContinue={onCompleteMockConfirmation}
          testID="contacts-add-address-confirmation"
          title={completionLabels.title}
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
