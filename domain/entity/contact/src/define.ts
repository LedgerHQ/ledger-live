import { ContactAddressSchema, ContactSchema } from "./schema";
import type { Contact, ContactAddress, ContactAddressInput, ContactInput } from "./types";

export function contact(data: ContactInput): Contact {
  return ContactSchema.parse(data);
}

export function contactAddress(data: ContactAddressInput): ContactAddress {
  return ContactAddressSchema.parse(data);
}
