import { CurrencyIdSchema, NonEmptyStringSchema, TokenIdSchema } from "@shared/schema-primitives";
import { z } from "zod";

export const ContactIdSchema = NonEmptyStringSchema;
export const ContactAddressIdSchema = NonEmptyStringSchema;
export const ContactCurrencyIdSchema = z.union([CurrencyIdSchema, TokenIdSchema]);

export const ContactNameSchema = NonEmptyStringSchema;

export const ContactAddressLabelSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[\x20-\x7E]+$/, "Expected printable ASCII characters");

export const ContactEvmAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Expected an EVM address");

export const ContactAddressSchema = z.object({
  id: ContactAddressIdSchema,
  currencyId: ContactCurrencyIdSchema,
  label: ContactAddressLabelSchema,
  address: ContactEvmAddressSchema,
});

export const ContactSchema = z.object({
  id: ContactIdSchema,
  isMe: z.boolean(),
  name: ContactNameSchema,
  addresses: z.array(ContactAddressSchema),
});
