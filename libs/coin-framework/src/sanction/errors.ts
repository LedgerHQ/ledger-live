import { createCustomErrorClass } from "@ledgerhq/errors";

export type AddressesSanctionedErrorAttributes = {
  addresses: string[];
};

export const AddressesSanctionedError = createCustomErrorClass<AddressesSanctionedErrorAttributes>(
  "AddressesSanctionedError",
);
