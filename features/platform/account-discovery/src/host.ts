import type { AccountDataRouter } from "@domain/api-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountExistence } from "@domain/entity-account-existence";
import type { AccountCandidate } from "@domain/entity-derivation";

/**
 * The descriptor of a candidate, its key derived on the device: an xpub for a UTXO account, an
 * address otherwise. Throws an `UnsupportedDerivation` when the device app has no such mode.
 */
export type DeriveAccount = (
  candidate: AccountCandidate,
  signal: AbortSignal,
) => Promise<AccountDescriptor>;

/** Whether an account has any history. */
export type AccountExists = (
  descriptor: AccountDescriptor,
  signal: AbortSignal,
) => Promise<boolean>;

export type DiscoveryHost = {
  readonly derive: DeriveAccount;
  readonly exists: AccountExists;
};

/** `exists` asked to the app's account data sources: the reads of one tick reach a batch reader together. */
export function existsThroughRouter(router: AccountDataRouter): AccountExists {
  return descriptor =>
    router.read("existence", descriptor).then(({ data }: { data: AccountExistence }) => data.used);
}
