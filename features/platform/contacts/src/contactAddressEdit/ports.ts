import type {
  ContactAddress,
  ContactAddressId,
  ContactAddressLabel,
  ContactAddressValue,
  ContactId,
} from "@domain/entity-contact";

export type ContactAddressUpdateInput = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId;
  label: ContactAddressLabel;
  address: ContactAddressValue;
}>;

export type ContactAddressEditPort = Readonly<{
  updateAddress(input: ContactAddressUpdateInput): Promise<ContactAddress>;
}>;
