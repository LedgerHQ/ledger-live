import { canonicalAccountKey, type AccountDescriptor } from "@domain/entity-account-descriptor";
import {
  fromLegacyAccount,
  toLegacyAccount,
  type LegacyAccountIdentity,
} from "../../account/accountDescriptor";

/** Its currency and on-chain identity, without what completion adds to a key (Aleo's view key); none for a descriptor its family cannot express. */
function identityOf(descriptor: () => AccountDescriptor): string | undefined {
  try {
    const resolved = descriptor();
    const { currencyId, xpub, publicKey, freshAddress } = toLegacyAccount(resolved);
    const key = xpub ?? publicKey ?? freshAddress;
    return key === undefined
      ? undefined
      : `${currencyId}:${canonicalAccountKey({ type: resolved.type, key })}`;
  } catch {
    return undefined;
  }
}

/** Whether the store already holds a discovered account; a discovered Aleo account, keyed on its address alone, matches the held one keyed with its view key. */
export function heldAccountMatcher(
  accounts: readonly LegacyAccountIdentity[],
): (descriptor: AccountDescriptor) => boolean {
  const held = new Set(accounts.map(account => identityOf(() => fromLegacyAccount(account))));
  held.delete(undefined);
  return descriptor => {
    const identity = identityOf(() => descriptor);
    return identity !== undefined && held.has(identity);
  };
}
