import { accountDescriptorKey, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { fromLegacyAccount, type LegacyAccountIdentity } from "../../account/accountDescriptor";

/** Its canonical descriptor key; none for an account its family cannot express as a descriptor. */
function identityOf(account: LegacyAccountIdentity): string | undefined {
  try {
    return accountDescriptorKey(fromLegacyAccount(account));
  } catch {
    return undefined;
  }
}

/** Whether the store already holds a discovered account, matched on its canonical descriptor key. */
export function heldAccountMatcher(
  accounts: readonly LegacyAccountIdentity[],
): (descriptor: AccountDescriptor) => boolean {
  const held = new Set(accounts.map(identityOf));
  held.delete(undefined);
  return descriptor => held.has(accountDescriptorKey(descriptor));
}
