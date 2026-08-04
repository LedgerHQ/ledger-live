import {
  CryptoCurrencyIdSchema,
  NonEmptyStringSchema,
  TokenCurrencyIdSchema,
} from "@shared/schema-primitives";
import { z } from "zod";
import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_NAME_ERROR_NAME,
} from "./errors";

export const ContactIdSchema = NonEmptyStringSchema;
export const ContactAddressIdSchema = NonEmptyStringSchema;
export const ContactCurrencyIdSchema = z.union([
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
]);

const ContactNamePattern =
  /^\p{L}[\p{L}\p{Mn}\p{Mc}]*(?:[\p{Zs}'\u2019-]\p{L}[\p{L}\p{Mn}\p{Mc}]*)*$/u;
const ContactAddressLabelPattern = /^(?=.*[A-Za-z0-9])[\x20-\x7E]+$/;

export const CONTACT_ADDRESS_LABEL_MAX_LENGTH = 32;

export const ContactNameSchema = z
  .string()
  .min(1, { error: INVALID_CONTACT_NAME_ERROR_NAME })
  .regex(ContactNamePattern, { error: INVALID_CONTACT_NAME_ERROR_NAME })
  .brand<"ContactName">();

export const ContactNameInputSchema = z
  .string()
  .trim()
  .transform((name) => name.normalize("NFC"))
  .pipe(z.union([z.literal(""), ContactNameSchema]));

export const ContactAddressLabelSchema = z
  .string()
  .min(1, { error: INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME })
  .max(CONTACT_ADDRESS_LABEL_MAX_LENGTH, {
    error: CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  })
  .regex(ContactAddressLabelPattern, {
    error: INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  })
  .brand<"ContactAddressLabel">();

export const ContactAddressLabelInputSchema = z
  .string()
  .trim()
  .transform((label) => label.normalize("NFC"))
  .pipe(z.union([z.literal(""), ContactAddressLabelSchema]));

export const ContactAddressValueSchema = NonEmptyStringSchema;

export const ContactAddressSchema = z.object({
  id: ContactAddressIdSchema,
  currencyId: ContactCurrencyIdSchema,
  label: ContactAddressLabelSchema,
  address: ContactAddressValueSchema,
});

export const ContactSchema = z.object({
  id: ContactIdSchema,
  isMe: z.boolean(),
  name: ContactNameSchema,
  addresses: z.array(ContactAddressSchema),
});
