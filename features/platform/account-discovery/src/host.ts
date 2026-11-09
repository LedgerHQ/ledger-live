import type { AccountDataRouter } from "@domain/api-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountExistence } from "@domain/entity-account-existence";
import type { AccountCandidate } from "@domain/entity-derivation";

/** A candidate's descriptor, derived on the device; rejects with an error named `UnsupportedDerivation` (as `@ledgerhq/errors` throws) for a mode the app lacks. */
export type DeriveAccount = (
  candidate: AccountCandidate,
  signal: AbortSignal,
) => Promise<AccountDescriptor>;

/** Whether an account has any history; stops its work once `signal` aborts. */
export type AccountExists = (
  descriptor: AccountDescriptor,
  signal: AbortSignal,
) => Promise<boolean>;

export type DiscoveryHost = {
  readonly derive: DeriveAccount;
  readonly exists: AccountExists;
};

/** `exists` asked to the app's account data sources, through the `existence` kind. */
export function existsThroughRouter(router: AccountDataRouter): AccountExists {
  return (descriptor, signal) =>
    router
      .read("existence", descriptor, { signal })
      .then(({ data }: { data: AccountExistence }) => data.used);
}
