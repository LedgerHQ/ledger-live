import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { AccountAddress, AccountAddressesState } from "./schema";

export type WithAccountAddresses = { accountAddresses: AccountAddressesState };

export const selectAccountAddress = (
  state: WithAccountAddresses,
  accountUUID: AccountUUID,
): AccountAddress | undefined => state.accountAddresses[accountUUID];
