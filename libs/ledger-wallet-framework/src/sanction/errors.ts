import { createCustomErrorClass } from "@ledgerhq/errors";

export const AddressesSanctionedError = createCustomErrorClass<{
  addresses: string[];
}>("AddressesSanctionedError");
