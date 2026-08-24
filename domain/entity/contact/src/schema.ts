import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { NonEmptyStringSchema } from "@shared/schema-primitives";
import { z } from "zod";
import {
  ContactAddressLabelTooLongError,
  InvalidContactAddressLabelError,
  InvalidContactNameError,
} from "./errors";
import {
  DeviceContactGroupCredentialsSchema,
  ExternalAddressDeviceContextSchema,
} from "./device/types";

export const ContactIdSchema = NonEmptyStringSchema;
export const ContactAddressIdSchema = NonEmptyStringSchema;
export const ContactCurrencyIdSchema = z.union([CryptoCurrencyIdSchema, TokenCurrencyIdSchema]);

const ContactNamePattern =
  /^\p{L}[\p{L}\p{Mn}\p{Mc}\p{Nd}]*(?:[\p{Zs}'\u2019-][\p{L}\p{Nd}][\p{L}\p{Mn}\p{Mc}\p{Nd}]*)*$/u;
const ContactAddressLabelPattern = /^(?=.*[A-Za-z0-9])[\x20-\x7E]+$/;

export const CONTACT_NAME_MAX_LENGTH = 32;
export const CONTACT_ADDRESS_LABEL_MAX_LENGTH = 32;

export const ContactNameSchema = z
  .string()
  .min(1, { error: () => new InvalidContactNameError().name })
  .max(CONTACT_NAME_MAX_LENGTH, {
    error: () => new InvalidContactNameError().name,
  })
  .regex(ContactNamePattern, {
    error: () => new InvalidContactNameError().name,
  })
  .brand<"ContactName">();

export const ContactNameInputSchema = z
  .string()
  .trim()
  .transform(name => name.normalize("NFC"))
  .pipe(z.union([z.literal(""), ContactNameSchema]));

export const ContactAddressLabelSchema = z
  .string()
  .min(1, { error: () => new InvalidContactAddressLabelError().name })
  .max(CONTACT_ADDRESS_LABEL_MAX_LENGTH, {
    error: () => new ContactAddressLabelTooLongError().name,
  })
  .regex(ContactAddressLabelPattern, {
    error: () => new InvalidContactAddressLabelError().name,
  })
  .brand<"ContactAddressLabel">();

export const ContactAddressLabelInputSchema = z
  .string()
  .trim()
  .transform(label => label.normalize("NFC"))
  .pipe(z.union([z.literal(""), ContactAddressLabelSchema]));

export const ContactAddressValueSchema = NonEmptyStringSchema;

export const ContactAddressSchema = z.object({
  id: ContactAddressIdSchema,
  currencyId: ContactCurrencyIdSchema,
  label: ContactAddressLabelSchema,
  address: ContactAddressValueSchema,
  device: ExternalAddressDeviceContextSchema,
});

const ContactBaseSchema = z.object({
  id: ContactIdSchema,
  name: ContactNameSchema,
  addresses: z.array(ContactAddressSchema),
  deviceCredentials: DeviceContactGroupCredentialsSchema.optional(),
});

export const MeContactSchema = ContactBaseSchema.extend({
  isMe: z.literal(true),
});

export const ContactGroupSchema = ContactBaseSchema.extend({
  isMe: z.literal(false),
});

export const ContactSchema = z
  .discriminatedUnion("isMe", [MeContactSchema, ContactGroupSchema])
  .superRefine((contact, context) => {
    if (contact.addresses.length > 0 && contact.deviceCredentials === undefined) {
      context.addIssue({
        code: "custom",
        message: "Contact addresses require device credentials",
        path: ["deviceCredentials"],
      });
    }
  });
