import type { AccountDataRouter } from "@domain/api-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountStatus } from "@domain/entity-account-status";
import type { AccountCandidate } from "@domain/entity-derivation";

/** An account looked up from a derived key (Hedera): while the key lists more after it, an empty one does not count toward the gap limit, as the legacy `keyHasMoreAddresses`. */
export type LookedUpAccount = {
  readonly descriptor: AccountDescriptor;
  readonly keyHasMoreAccounts: boolean;
};

/** A candidate's descriptor, derived on the device; rejects with an error named `UnsupportedDerivation` (as `@ledgerhq/errors` throws) for a mode the app lacks; `null` ends the mode there, as the legacy scan's iterate does. */
export type DeriveAccount = (
  candidate: AccountCandidate,
  signal: AbortSignal,
) => Promise<AccountDescriptor | LookedUpAccount | null>;

/** Whether an account was ever used, and its gate; stops its work once `signal` aborts. */
export type ReadAccountStatus = (
  descriptor: AccountDescriptor,
  signal: AbortSignal,
) => Promise<AccountStatus>;

export type DiscoveryHost = {
  readonly derive: DeriveAccount;
  readonly readStatus: ReadAccountStatus;
};

/** The `accountStatus` kind, asked to the app's account data sources. */
export function statusThroughRouter(router: AccountDataRouter): ReadAccountStatus {
  return (descriptor, signal) =>
    router
      .read("accountStatus", descriptor, { signal })
      .then(({ data }: { data: AccountStatus }) => data);
}
