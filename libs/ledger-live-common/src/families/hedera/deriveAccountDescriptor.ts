import { defer, from, map, of, switchMap, tap } from "rxjs";
import { AccountDescriptorSchema } from "@domain/entity-account-descriptor";
import { fromDescriptorPath } from "@domain/entity-derivation";
import type { DeriveAccountDescriptor, RunOnTransport } from "../../coin-modules/types";
import { hederaAccountKey } from "./accountKey";
import { getAddressesForPublicKey } from "./bridge/api";
import { createSigner as createFrameworkSigner } from "./signer";

type KeyAccounts = { publicKey: string; accountIds: string[] };

/** The device key and the account ids the mirror node lists for it, per network and derived key path, for one scan (its `runOnTransport`): one device read and one lookup per mode. */
const accountIdsByScan = new WeakMap<RunOnTransport, Map<string, KeyAccounts>>();

/** The index-th account the mirror node lists for the key at the candidate path, as the address lookup of the generic bridge's scan; `null` past them ends the mode. */
export const deriveAccountDescriptor: DeriveAccountDescriptor = (
  runOnTransport,
  currency,
  candidate,
) => {
  const path = fromDescriptorPath(candidate.addressPath);
  const cacheKey = `${currency.id}:${path}`;
  const scanCache = accountIdsByScan.get(runOnTransport) ?? new Map<string, KeyAccounts>();
  accountIdsByScan.set(runOnTransport, scanCache);
  const keyAccounts$ = defer(() => {
    const cached = scanCache.get(cacheKey);
    if (cached) return of(cached);
    return runOnTransport(transport =>
      from(createFrameworkSigner(transport).getAddress(path)),
    ).pipe(
      switchMap(async ({ publicKey }) => ({
        publicKey,
        accountIds: await getAddressesForPublicKey(currency, publicKey),
      })),
      tap(keyAccounts => scanCache.set(cacheKey, keyAccounts)),
    );
  });
  return keyAccounts$.pipe(
    map(({ publicKey, accountIds }) => {
      const accountId = accountIds[candidate.index];
      if (!accountId) return null;
      const key = hederaAccountKey.keyOf({ freshAddress: accountId, seedIdentifier: publicKey });
      if (!key) throw new Error("The device gave a Hedera public key that is not hex");
      const descriptor = AccountDescriptorSchema.parse({
        purpose: "account",
        version: "2",
        type: "address",
        network: candidate.network,
        key,
        path: candidate.addressPath,
      });
      return { descriptor, keyHasMoreAccounts: candidate.index < accountIds.length - 1 };
    }),
  );
};
