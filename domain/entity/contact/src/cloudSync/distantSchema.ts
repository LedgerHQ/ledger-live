import { z } from "zod";
import { DEFAULT_ME_CONTACT_ID } from "../constants";

const DistantStringSchema = z.string().min(1);
const DistantChainIdSchema = z.union([z.string().min(1), z.number().finite()]);

const DistantDeviceContactGroupCredentialsSchema = z
  .object({
    groupHandle: DistantStringSchema,
    hmacProof: DistantStringSchema,
  })
  .passthrough();

const DistantExternalAddressSchema = z
  .object({
    id: DistantStringSchema,
    currencyId: DistantStringSchema,
    label: DistantStringSchema,
    address: DistantStringSchema,
    device: z
      .object({
        blockchainFamily: DistantStringSchema,
        chainId: DistantChainIdSchema,
        hmacRest: DistantStringSchema,
      })
      .passthrough(),
  })
  .passthrough();

const DistantContactSchema = z
  .object({
    name: DistantStringSchema,
    deviceCredentials: DistantDeviceContactGroupCredentialsSchema.optional(),
    addresses: z.array(DistantExternalAddressSchema),
  })
  .passthrough();

const DistantContactGroupSchema = DistantContactSchema.extend({
  id: DistantStringSchema,
});

export const ContactsDistantSchema = z
  .object({
    me: DistantContactSchema,
    contactGroups: z.array(DistantContactGroupSchema),
  })
  .passthrough();

export type ContactsWire = z.infer<typeof ContactsDistantSchema>;
export type DistantRecord = Readonly<Record<string, unknown>>;
export type DistantAddress = ContactsWire["me"]["addresses"][number];
export type DistantContact = ContactsWire["me"];
export type DistantContactGroup = ContactsWire["contactGroups"][number];

export function asDistantRecord(value: unknown): DistantRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as DistantRecord)
    : null;
}

function hasUniqueIds(values: readonly { id: string }[]): boolean {
  return new Set(values.map(value => value.id)).size === values.length;
}

function hasUniqueAddressIds(
  contacts: readonly { addresses: readonly { id: string }[] }[],
): boolean {
  return contacts.every(contact => hasUniqueIds(contact.addresses));
}

function hasRequiredCredentials(contact: {
  readonly addresses: readonly unknown[];
  readonly deviceCredentials?: unknown;
}): boolean {
  return contact.addresses.length === 0 || contact.deviceCredentials !== undefined;
}

export function isValidContactsWire(value: ContactsWire): boolean {
  return (
    value.contactGroups.every(contactGroup => contactGroup.id !== DEFAULT_ME_CONTACT_ID) &&
    hasUniqueIds(value.contactGroups) &&
    hasUniqueAddressIds([value.me, ...value.contactGroups]) &&
    hasRequiredCredentials(value.me) &&
    value.contactGroups.every(hasRequiredCredentials)
  );
}

export function parseContactsWire(value: unknown): ContactsWire | null {
  const result = ContactsDistantSchema.safeParse(value);
  const raw = asDistantRecord(value);
  const rawMe = asDistantRecord(raw?.me);
  const rawContactGroups = Array.isArray(raw?.contactGroups) ? raw.contactGroups : [];
  const hasReservedRoleFields =
    (rawMe !== null && ("id" in rawMe || "isMe" in rawMe)) ||
    rawContactGroups.some(contactGroup => {
      const record = asDistantRecord(contactGroup);
      return record !== null && "isMe" in record;
    });

  return result.success && isValidContactsWire(result.data) && !hasReservedRoleFields
    ? result.data
    : null;
}
