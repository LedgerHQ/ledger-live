import type {
  ContactAddressId,
  ContactAddressInput,
  ContactAddressLabel,
  ContactId,
} from "@domain/entity-contact";
import type { ContactDetailState } from "./detail";

export type AddAddressNetworkOption = Readonly<{
  currencyId: ContactAddressInput["currencyId"];
  label: string;
  ticker?: string;
  disabledReason?: string;
}>;

type AddAddressAssetOptionBase = Readonly<{
  id: string;
  label: string;
  ticker?: string;
  disabledReason?: string;
}>;

export type AddAddressAssetOption =
  | (AddAddressAssetOptionBase &
      Readonly<{
        currencyId: ContactAddressInput["currencyId"];
        networkOptions?: never;
      }>)
  | (AddAddressAssetOptionBase &
      Readonly<{
        currencyId?: never;
        networkOptions: readonly AddAddressNetworkOption[];
      }>);

export type AddAddressOptions = Readonly<{
  assets: readonly AddAddressAssetOption[];
}>;

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
      reason: "invalid-address-format" | "invalid-label" | "unsupported-currency" | "unsupported-network";
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
  loadAddAddressOptions(contactId: ContactId): Promise<AddAddressOptions>;
  validateAddressCandidate(input: AddressCandidateInput): Promise<AddressCandidateValidation>;
  prepareAddressRegistration(candidate: ValidAddressCandidate): Promise<AddressRegistrationDraft>;
  applyConfirmedAddressRegistration(result: ConfirmedAddressRegistrationResult): Promise<ContactDetailState>;
}>;

export type AddressEditPort = Readonly<{
  prepareAddressEdit(input: AddressEditInput): Promise<AddressEditDraft>;
  applyConfirmedAddressEdit(result: ConfirmedAddressEditResult): Promise<ContactDetailState>;
}>;
