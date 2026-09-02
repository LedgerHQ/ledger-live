import React from "react";
import { ContactsAddAddressEntry } from "../AddressEntry/components/ContactsAddAddressEntry/ContactsAddAddressEntry";
import type { SanctionedAddressBannerProps } from "../../components/SanctionedAddressBanner/types";
import { ContactsAddAddressNameInput } from "../AddressName/components/Input/ContactsAddAddressNameInput";
import type { ContactsAddAddressNameLabels } from "../AddressName/types";
import { ContactsAddAddressReview, type ContactsAddAddressReviewLabels } from "../Review";
import type {
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
  reviewLabels?: ContactsAddAddressReviewLabels;
  onAddressChange: (address: string, inputMethod: AddAddressInputSource) => void;
  onContinueFromAddressDetails: () => void;
  onAddressLabelChange: (value: string) => void;
  onContinueFromName: () => void;
  onContinueFromReview: () => void;
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
  reviewLabels,
  onAddressChange,
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
          showConfirmedAddress={state.entryMode === "mad"}
          onAddressLabelChange={onAddressLabelChange}
          onContinue={onContinueFromName}
        />
      );
    case "confirmationRequired":
      return null;
    case "reviewingAddress":
      if (
        state.entryMode === "prefilled" &&
        state.displayContext !== null &&
        reviewLabels !== undefined
      ) {
        return (
          <ContactsAddAddressReview
            addressEntry={state.addressEntry}
            addressLabel={state.addressLabel}
            displayContext={state.displayContext}
            labels={reviewLabels}
            onContinue={onContinueFromReview}
          />
        );
      }
      return null;
    case "success":
      return null;
  }
}
