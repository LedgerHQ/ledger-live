import { v4 as uuid } from "uuid";
import { ContactAddressSchema, ContactSchema } from "./schema";
import type {
  Contact,
  ContactAddress,
  ContactAddressCreationInput,
  ContactAddressInput,
  ContactInput,
} from "./types";

export function contact(data: ContactInput): Contact {
  return ContactSchema.parse(data);
}

export function contactAddress(data: ContactAddressInput): ContactAddress {
  return ContactAddressSchema.parse(data);
}

export function createContactAddress(data: ContactAddressCreationInput): ContactAddress {
  return contactAddress({
    id: `address-${uuid()}`,
    ...data,
  });
}
