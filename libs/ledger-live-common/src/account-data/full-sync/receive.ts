import type { Account } from "@ledgerhq/types-live";
import type { AccountReceive } from "@domain/entity-account-receive";
import { defaultAccountReceive } from "../../account/accountReceive";
import { resolveFamily } from "../../bridge/zcashRouting";
import { loadAccountReceiveForFamily } from "../../coin-modules/registry";

/** The `receive` kind of a synced account: its family's own rule if it has one, else the default. */
export async function toAccountReceive(account: Account): Promise<AccountReceive> {
  const familyReceive = await loadAccountReceiveForFamily(resolveFamily(account.currency));
  return (familyReceive ?? defaultAccountReceive)(account);
}
