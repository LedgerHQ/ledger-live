import { ExternalAddressProofSchema, ExternalContactNameProofSchema } from "@domain/entity-contact";
import {
  mockDeviceContactGroupCredentials,
  mockExternalAddressDeviceContext,
} from "@domain/entity-contact/schema.mock";
import type { ContactDeviceIntentsPort } from "./contactDeviceIntentsPort";

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
