import {
  ExternalAddressProofSchema,
  ExternalContactNameProofSchema,
  type Contact,
  type ContactAddress,
  type ContactAddressLabel,
  type ContactAddressValue,
  type ContactName,
} from "@domain/entity-contact";
import {
  mockDeviceContactGroupCredentials,
  mockExternalAddressDeviceContext,
} from "@domain/entity-contact/schema.mock";

export type RegisterExternalAddressIntentInput = Readonly<{
  contact: Pick<Contact, "id" | "name" | "deviceCredentials">;
  currencyId: ContactAddress["currencyId"];
  label: ContactAddressLabel;
  address: ContactAddressValue;
}>;

export type RegisterExternalAddressIntentResult = Readonly<{
  deviceCredentials: NonNullable<Contact["deviceCredentials"]>;
  addressDeviceContext: ContactAddress["device"];
}>;

export type RenameExternalContactIntentInput = Readonly<{
  contact: Contact;
  name: ContactName;
}>;

export type EditExternalAddressScopeIntentInput = Readonly<{
  contact: Contact;
  address: ContactAddress;
  label: ContactAddressLabel;
}>;

export type ContactDeviceIntentsPort = Readonly<{
  registerExternalAddress(
    input: RegisterExternalAddressIntentInput,
  ): Promise<RegisterExternalAddressIntentResult>;
  renameExternalContact(
    input: RenameExternalContactIntentInput,
  ): Promise<NonNullable<Contact["deviceCredentials"]>>;
  editExternalAddressScope(
    input: EditExternalAddressScopeIntentInput,
  ): Promise<ContactAddress["device"]>;
}>;

export function createMockContactDeviceIntentsPort(): ContactDeviceIntentsPort {
  return {
    registerExternalAddress: async input => ({
      deviceCredentials: input.contact.deviceCredentials ?? mockDeviceContactGroupCredentials(),
      addressDeviceContext: mockExternalAddressDeviceContext(),
    }),
    renameExternalContact: async input =>
      mockDeviceContactGroupCredentials({
        ...(input.contact.deviceCredentials === undefined
          ? {}
          : { groupHandle: input.contact.deviceCredentials.groupHandle }),
        hmacProof: ExternalContactNameProofSchema.parse(
          "mock-external-contact-name-proof-after-rename",
        ),
      }),
    editExternalAddressScope: async input =>
      mockExternalAddressDeviceContext({
        ...input.address.device,
        hmacRest: ExternalAddressProofSchema.parse("mock-external-address-proof-after-scope-edit"),
      }),
  };
}
