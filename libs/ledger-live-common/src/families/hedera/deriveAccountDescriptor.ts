import { defer, from, map, of, switchMap, tap } from "rxjs";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import type { DeriveAccountDescriptor, RunOnTransport } from "../../coin-modules/types";
import { toLegacyPath } from "../../account/accountDescriptor";
import { getAddressesForPublicKey } from "./bridge/api";
import { createSigner as createFrameworkSigner } from "./signer";

/** The account ids the mirror node lists per network and derived key path, for one scan (its `runOnTransport`): one device read and one lookup per mode. */
const accountIdsByScan = new WeakMap<RunOnTransport, Map<string, string[]>>();

/** The index-th account the mirror node lists for the key at the candidate path, as the address lookup of the generic bridge's scan; `null` past them ends the mode. */
export const deriveAccountDescriptor: DeriveAccountDescriptor = (
  runOnTransport,
  currency,
  candidate,
) => {
  const path = toLegacyPath(candidate.addressPath);
  const cacheKey = `${currency.id}:${path}`;
  const scanCache = accountIdsByScan.get(runOnTransport) ?? new Map<string, string[]>();
  accountIdsByScan.set(runOnTransport, scanCache);
  const accountIds$ = defer(() => {
    const cached = scanCache.get(cacheKey);
    if (cached) return of(cached);
    return runOnTransport(transport =>
      from(createFrameworkSigner(transport).getAddress(path)),
    ).pipe(
      switchMap(({ publicKey }) => getAddressesForPublicKey(currency, publicKey)),
      tap(accountIds => scanCache.set(cacheKey, accountIds)),
    );
  });
  return accountIds$.pipe(
    map(accountIds => {
      const accountId = accountIds[candidate.index];
      if (!accountId) return null;
      const descriptor = AccountDescriptorSchema.parse({
        purpose: "account",
        version: "2",
        type: "address",
        network: candidate.network,
        key: accountId,
        path: candidate.addressPath,
      });
      return { descriptor, keyHasMoreAccounts: candidate.index < accountIds.length - 1 };
    }),
  );
};
