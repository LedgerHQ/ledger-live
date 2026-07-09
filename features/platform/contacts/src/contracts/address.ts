import type {
  ContactAddressId,
  ContactAddressInput,
  ContactAddressLabel,
  ContactId,
} from "@domain/entity-contact";
import type { ContactDetailState } from "./detail";

export type SupportedAddressCurrencyIds = readonly ContactAddressInput["currencyId"][];

export type AddressCandidateInput = Readonly<{
  contactId: ContactId;
  currencyId: ContactAddressInput["currencyId"];
  address: string;
  label: string;
}>;

export type ValidAddressCandidate = Readonly<{
  contactId: ContactId;
  address: ContactAddressInput;
}>;

export type AddressCandidateValidation =
  | Readonly<{
      type: "valid";
      candidate: ValidAddressCandidate;
    }>
  | Readonly<{
      type: "invalid";
      reason: "invalid-address-format" | "invalid-label" | "unsupported-currency";
    }>;

export type AddressRegistrationDraft = Readonly<{
  contactId: ContactId;
  address: ContactAddressInput;
}>;

export type ConfirmedAddressRegistrationResult = Readonly<{
  draft: AddressRegistrationDraft;
  confirmationId: string;
}>;

export type AddressEditInput = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId;
  label: ContactAddressLabel;
}>;

export type AddressEditDraft = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId;
  label: ContactAddressLabel;
}>;

export type ConfirmedAddressEditResult = Readonly<{
  draft: AddressEditDraft;
  confirmationId: string;
}>;

export type AddAddressPort = Readonly<{
  loadSupportedAddressCurrencyIds(contactId: ContactId): Promise<SupportedAddressCurrencyIds>;
  validateAddressCandidate(input: AddressCandidateInput): Promise<AddressCandidateValidation>;
  prepareAddressRegistration(candidate: ValidAddressCandidate): Promise<AddressRegistrationDraft>;
  applyConfirmedAddressRegistration(result: ConfirmedAddressRegistrationResult): Promise<ContactDetailState>;
}>;

export type AddressEditPort = Readonly<{
  prepareAddressEdit(input: AddressEditInput): Promise<AddressEditDraft>;
  applyConfirmedAddressEdit(result: ConfirmedAddressEditResult): Promise<ContactDetailState>;
}>;
