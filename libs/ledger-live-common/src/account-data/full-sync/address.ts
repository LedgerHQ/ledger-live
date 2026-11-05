import type { Account } from "@ledgerhq/types-live";
import { AccountAddressSchema, type AccountAddress } from "@domain/entity-account-address";

/** The `address` kind of a synced account: the fresh address its sync rotated to. */
export const toAccountAddress = (account: Pick<Account, "freshAddress">): AccountAddress =>
  AccountAddressSchema.parse({ freshAddress: account.freshAddress });
