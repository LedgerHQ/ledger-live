import { catchError, concat, concatMap, defer, from, of, throwError } from "rxjs";
import { throwIfAborted } from "@ledgerhq/coin-module-framework/promises";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { fromDescriptorPath } from "@domain/entity-derivation";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { AccountCompletionEvent } from "@features/platform-account-discovery/descriptor";
import { toLegacyAccount } from "../../account/accountDescriptor";
import { CompletionAccountMismatchError } from "../../account-data/discovery/errors";
import type { CompleteAccountDescriptors } from "../../coin-modules/types";
import type { Resolver as AddressResolver } from "../../hw/getAddress/types";
import type { Resolver as ViewKeyResolver } from "./hw/getViewKey/types";

// By name, as the legacy getViewKeyExec: an error crossing a process boundary loses its prototype.
const isRefusal = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "name" in error &&
  error.name === "UserRefusedOnDevice";

/** One view key approval per account, on the session; a refusal settles that account, any other error stops the batch for the Device Intent to handle. */
export function createCompleteAccountDescriptors(
  resolveViewKey: ViewKeyResolver,
  resolveAddress: AddressResolver,
): CompleteAccountDescriptors {
  const completeOne = async (
    transport: Parameters<ViewKeyResolver>[0],
    currency: CryptoCurrency,
    source: AccountDescriptor,
    signal: AbortSignal,
  ): Promise<AccountCompletionEvent> => {
    const path = fromDescriptorPath(source.path);
    // The completion may run on another device than the scan: its view key must belong to the scanned address.
    const { address } = await resolveAddress(transport, {
      currency,
      path,
      derivationMode: toLegacyAccount(source).derivationMode,
    });
    if (address !== source.key) {
      const error = new CompletionAccountMismatchError(
        "This device derives another account on this path: use the device and seed used for the scan.",
      );
      return { source, state: { type: "failed", error } };
    }
    throwIfAborted(signal);
    const { viewKey } = await resolveViewKey(transport, { path, currency });
    return { source, state: { type: "completed", context: { viewKey } } };
  };

  return (runOnTransport, currency, selected) =>
    concat(
      from(selected.map(source => ({ source, state: { type: "waiting" } as const }))),
      from(selected).pipe(
        concatMap(source =>
          concat(
            of<AccountCompletionEvent>({ source, state: { type: "awaiting-approval" } }),
            runOnTransport((transport, signal) =>
              defer(() => completeOne(transport, currency, source, signal)),
            ).pipe(
              catchError(error =>
                isRefusal(error)
                  ? of<AccountCompletionEvent>({ source, state: { type: "refused" } })
                  : throwError(() => error),
              ),
            ),
          ),
        ),
      ),
    );
}
