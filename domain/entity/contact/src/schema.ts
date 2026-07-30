import {
  CryptoCurrencyIdSchema,
  NonEmptyStringSchema,
  TokenCurrencyIdSchema,
} from "@shared/schema-primitives";
import { z } from "zod";

export const ContactIdSchema = NonEmptyStringSchema;
export const ContactAddressIdSchema = NonEmptyStringSchema;
export const ContactCurrencyIdSchema = z.union([CryptoCurrencyIdSchema, TokenCurrencyIdSchema]);

const ContactNamePattern =
  /^\p{L}[\p{L}\p{Mn}\p{Mc}]*(?:[\p{Zs}'\u2019-]\p{L}[\p{L}\p{Mn}\p{Mc}]*)*$/u;
const ContactAddressLabelPattern = /^(?=.*[\p{L}\p{N}])[\p{L}\p{Mn}\p{Mc}\p{N}\p{P}\p{Zs}]+$/u;

export const ContactNameSchema = NonEmptyStringSchema.regex(
  ContactNamePattern,
  "Expected letters, spaces, apostrophes, or hyphens",
);

export const ContactAddressLabelSchema = NonEmptyStringSchema.regex(ContactAddressLabelPattern);

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
