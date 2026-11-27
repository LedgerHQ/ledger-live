import { concat, concatMap, defer, from, map, mergeMap, of, tap, type Observable } from "rxjs";
import { throwIfAborted } from "@ledgerhq/coin-module-framework/promises";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { fromDescriptorPath } from "@domain/entity-derivation";
import type { AccountCompletionEvent } from "@features/platform-account-discovery/descriptor";
import { CompletionAccountMismatchError } from "../../account-data/discovery/errors";
import type { CompleteAccountDescriptors } from "../../coin-modules/types";
import { getAddressesForPublicKey } from "./bridge/api";
import { createSigner } from "./signer";

/** No approval is asked: an account goes from `waiting` to its result. */
export const completeAccountDescriptors: CompleteAccountDescriptors = (
  runOnTransport,
  currency,
  selected,
) => {
  const publicKeys = new Map<string, string>();
  const accountIdsOfKey = new Map<string, Promise<string[]>>();

  const publicKeyAt = (path: string): Observable<string> => {
    const known = publicKeys.get(path);
    if (known) return of(known);
    return runOnTransport((transport, signal) =>
      defer(async () => {
        const { publicKey } = await createSigner(transport).getAddress(path);
        throwIfAborted(signal);
        return publicKey;
      }),
    ).pipe(tap(publicKey => publicKeys.set(path, publicKey)));
  };

  const accountIdsOf = (publicKey: string) => {
    const known = accountIdsOfKey.get(publicKey);
    if (known) return known;
    const lookup = getAddressesForPublicKey(currency, publicKey);
    accountIdsOfKey.set(publicKey, lookup);
    return lookup;
  };

  const complete = (source: AccountDescriptor): Observable<AccountCompletionEvent> =>
    publicKeyAt(fromDescriptorPath(source.path)).pipe(
      mergeMap(publicKey =>
        from(accountIdsOf(publicKey)).pipe(
          map((accountIds): AccountCompletionEvent => {
            if (accountIds.includes(source.key)) {
              return { source, state: { type: "completed", context: { publicKey } } };
            }
            const error = new CompletionAccountMismatchError(
              "This device derives another account on this path: use the device and seed used for the scan.",
            );
            return { source, state: { type: "failed", error } };
          }),
        ),
      ),
    );

  return concat(
    from(selected.map(source => ({ source, state: { type: "waiting" } as const }))),
    from(selected).pipe(concatMap(complete)),
  );
};
