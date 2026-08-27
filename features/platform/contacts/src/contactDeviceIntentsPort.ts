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
export {
  ContactDeviceIntentCancelledError,
  ContactDeviceIntentMissingResultError,
} from "./device/errors";

export type RegisterExternalAddressInput = Readonly<{
  contact: Pick<Contact, "id" | "name" | "deviceCredentials">;
  currencyId: ContactAddress["currencyId"];
  label: ContactAddressLabel;
  address: ContactAddressValue;
}>;

export type RegisterExternalAddressResult = Readonly<{
  deviceCredentials: NonNullable<Contact["deviceCredentials"]>;
  addressDeviceContext: ContactAddress["device"];
}>;

export type RenameExternalContactInput = Readonly<{
  contact: Contact;
  name: ContactName;
}>;

export type RenameExternalContactResult = NonNullable<Contact["deviceCredentials"]>;

export type EditExternalAddressInput = Readonly<{
  contact: Contact;
  address: ContactAddress;
  updatedLabel: ContactAddressLabel;
  updatedAddress: ContactAddressValue;
}>;

export type EditExternalAddressResult = ContactAddress["device"];

export class EditExternalAddressError extends Error {
  override name = "EditExternalAddressError" as const;

  constructor(options: ErrorOptions) {
    super("The external address could not be fully updated", options);
  }
}

export type ContactDeviceIntentsPort = Readonly<{
  registerExternalAddress(
    input: RegisterExternalAddressInput,
  ): Promise<RegisterExternalAddressResult>;
  renameExternalContact(input: RenameExternalContactInput): Promise<RenameExternalContactResult>;
  editExternalAddress(input: EditExternalAddressInput): Promise<EditExternalAddressResult>;
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
    editExternalAddress: async input =>
      mockExternalAddressDeviceContext({
        ...input.address.device,
        hmacRest: ExternalAddressProofSchema.parse("mock-external-address-proof-after-scope-edit"),
      }),
  };
}
