import type { Account } from "@ledgerhq/types-live";
import type { AccountStatus } from "@domain/entity-account-status";
import { defaultAccountStatus } from "../../account/accountStatus";

/** Used by the Kaspa scan rule (an operation, as its shape sets `used`): a sync also counts a balance. */
export default function kaspaAccountStatus(account: Account): AccountStatus {
  return { ...defaultAccountStatus(account), used: account.operations.length > 0 };
}
