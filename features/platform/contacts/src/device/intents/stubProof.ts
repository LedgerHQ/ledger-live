import { ExternalAddressProofSchema, ExternalContactNameProofSchema } from "@domain/entity-contact";
import {
  mockDeviceContactGroupCredentials,
  mockExternalAddressDeviceContext,
} from "@domain/entity-contact/schema.mock";

export const stubDeviceContactGroupCredentials = mockDeviceContactGroupCredentials();
export const stubExternalAddressDeviceContext = mockExternalAddressDeviceContext();

export const stubRenamedContactHmacProof = ExternalContactNameProofSchema.parse(
  "mock-external-contact-name-proof-after-rename",
);

export const stubEditedAddressHmacRest = ExternalAddressProofSchema.parse(
  "mock-external-address-proof-after-scope-edit",
);

export const stubProof = (kind: string): string => `contacts-die-stub-${kind}`;
