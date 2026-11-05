import { z } from "zod";
import { AccountUUIDSchema, AddressSchema } from "@domain/entity-account-descriptor";

/** Where the account receives next. */
export const AccountAddressSchema = z.object({
  freshAddress: AddressSchema,
});

export type AccountAddress = z.infer<typeof AccountAddressSchema>;

export const AccountAddressesStateSchema = z.partialRecord(AccountUUIDSchema, AccountAddressSchema);

export type AccountAddressesState = z.infer<typeof AccountAddressesStateSchema>;

export const initialAccountAddressesState: AccountAddressesState = {};

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    address: { query: undefined; result: AccountAddress };
  }
}
