import type { ChangeEvent } from "react";
import type { ContactAddressLabelValidationErrorName } from "@domain/entity-contact";
import type { AddAddressLabelState, AddAddressNameLabels } from "../types";

export type ContactsAddAddressNameLabels = Readonly<{
  inputLabel: string;
  namingDisclaimer: string;
  namingDisclaimerAccessibilityLabel: string;
  continueToReview: string;
  validationErrors: Record<ContactAddressLabelValidationErrorName, string>;
}>;

export type ContactsAddAddressNameProps = Readonly<{
  addressLabel: AddAddressLabelState;
  labels: ContactsAddAddressNameLabels;
  onAddressLabelChange: (value: string) => void;
  onContinue: () => void;
}>;

export type ContactsAddAddressNameViewProps = Readonly<{
  addressLabel: AddAddressLabelState;
  labels: ContactsAddAddressNameLabels;
  validationMessage?: string;
  isContinueEnabled: boolean;
  onAddressLabelChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onContinue: () => void;
}>;

export type ContactsAddAddressNameNativeProps = Readonly<{
  addressLabel: AddAddressLabelState;
  labels: AddAddressNameLabels;
  bottomOffset?: number;
  onChangeText: (value: string) => void;
  onContinue: () => void;
}>;
