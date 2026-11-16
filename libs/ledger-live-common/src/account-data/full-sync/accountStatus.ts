import type { Account } from "@ledgerhq/types-live";
import { AccountStatusSchema, type AccountStatus } from "@domain/entity-account-status";
import { defaultAccountStatus } from "../../account/accountStatus";
import { loadAccountStatusForFamily } from "../../coin-modules/registry";

/** The `accountStatus` kind of a synced account, whatever the asset. */
export async function toAccountStatus(account: Account): Promise<AccountStatus> {
  const familyAccountStatus = await loadAccountStatusForFamily(account.currency.family);
  return AccountStatusSchema.parse((familyAccountStatus ?? defaultAccountStatus)(account));
}
