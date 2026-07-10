import { z } from "zod";
import {
  ContactAddressIdSchema,
  ContactAddressLabelSchema,
  ContactAddressSchema,
  ContactAddressValueSchema,
  ContactCurrencyIdSchema,
  ContactIdSchema,
  ContactNameSchema,
  ContactSchema,
} from "./schema";

export type ContactId = z.infer<typeof ContactIdSchema>;
export type ContactAddressId = z.infer<typeof ContactAddressIdSchema>;
export type ContactCurrencyId = z.infer<typeof ContactCurrencyIdSchema>;
export type ContactName = z.infer<typeof ContactNameSchema>;
export type ContactAddressLabel = z.infer<typeof ContactAddressLabelSchema>;
export type ContactAddressValue = z.infer<typeof ContactAddressValueSchema>;
export type ContactAddress = z.infer<typeof ContactAddressSchema>;
export type Contact = z.infer<typeof ContactSchema>;

export type ContactsState = {
  contacts: Contact[];
};

export type ContactAddressInput = z.input<typeof ContactAddressSchema>;
export type ContactInput = z.input<typeof ContactSchema>;
