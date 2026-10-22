import type { ContactAddressId, ContactId } from "@domain/entity-contact";

export type ContactAddressDeletionInput = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId;
}>;

export type ContactAddressDeletionPort = Readonly<{
  deleteAddress(input: ContactAddressDeletionInput): Promise<void>;
}>;
