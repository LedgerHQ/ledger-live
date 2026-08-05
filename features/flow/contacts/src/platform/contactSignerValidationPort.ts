import type { ContactAddressId, ContactId, ContactSignerId } from "@domain/entity-contact";

export type ContactAddressSignerLookup = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId;
}>;

/** Mocked until US-07 provides real device signer validation. */
export type ContactSignerValidationPort = Readonly<{
  getExpectedSignerId(input: ContactAddressSignerLookup): Promise<ContactSignerId | null>;
  getCurrentSignerId(): Promise<ContactSignerId | null>;
}>;

export type CreateMockContactSignerValidationPortOptions = Readonly<{
  expectedSignerId?: ContactSignerId | null;
  currentSignerId?: ContactSignerId | null;
}>;

export function createMockContactSignerValidationPort(
  options: CreateMockContactSignerValidationPortOptions = {},
): ContactSignerValidationPort {
  const {
    expectedSignerId = "signer-a",
    currentSignerId = "signer-a",
  } = options;

  return {
    getExpectedSignerId: async () => expectedSignerId,
    getCurrentSignerId: async () => currentSignerId,
  };
}
