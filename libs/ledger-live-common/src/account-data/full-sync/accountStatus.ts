import type { Account } from "@ledgerhq/types-live";
import { AccountStatusSchema, type AccountStatus } from "@domain/entity-account-status";
import { defaultAccountStatus } from "../../account/accountStatus";
import { resolveFamily } from "../../bridge/zcashRouting";
import { loadAccountStatusForFamily } from "../../coin-modules/registry";

/** The `accountStatus` kind of a synced account, whatever the asset. */
export async function toAccountStatus(account: Account): Promise<AccountStatus> {
  const familyAccountStatus = await loadAccountStatusForFamily(resolveFamily(account.currency));
  return AccountStatusSchema.parse((familyAccountStatus ?? defaultAccountStatus)(account));
}
