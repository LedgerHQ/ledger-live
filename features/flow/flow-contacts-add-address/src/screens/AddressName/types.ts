import type { ChangeEvent } from "react";
import type { ContactAddressLabelValidationErrorName } from "@domain/entity-contact";
import type { AddAddressLabelState, ValidAddAddressEntryState } from "../../state/types";

export type ContactsAddAddressNameLabels = Readonly<{
  inputLabel: string;
  namingDisclaimer: string;
  namingDisclaimerAccessibilityLabel: string;
  continueToReview: string;
  validAddress: string;
  validationErrors: Record<ContactAddressLabelValidationErrorName, string>;
}>;

export type ContactsAddAddressNameProps = Readonly<{
  addressEntry: ValidAddAddressEntryState;
  addressLabel: AddAddressLabelState;
  labels: ContactsAddAddressNameLabels;
  showConfirmedAddress?: boolean;
  onAddressLabelChange: (value: string) => void;
  onContinue: () => void;
}>;

export type ContactsAddAddressNameViewProps = Readonly<{
  address: string;
  addressLabel: AddAddressLabelState;
  labels: ContactsAddAddressNameLabels;
  showConfirmedAddress: boolean;
  validationMessage?: string;
  isContinueEnabled: boolean;
  onAddressLabelChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onContinue: () => void;
}>;
