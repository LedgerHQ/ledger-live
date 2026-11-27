import { concat, concatMap, defer, from } from "rxjs";
import { throwIfAborted } from "@ledgerhq/coin-module-framework/promises";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { fromDescriptorPath } from "@domain/entity-derivation";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { AccountCompletionEvent } from "@features/platform-account-discovery/descriptor";
import { CompletionAccountMismatchError } from "../../account-data/discovery/errors";
import type { CompleteAccountDescriptors } from "../../coin-modules/types";
import { getAddressesForPublicKey } from "./bridge/api";
import { createSigner } from "./signer";

const completeOne = async (
  transport: Parameters<typeof createSigner>[0],
  currency: CryptoCurrency,
  source: AccountDescriptor,
  signal: AbortSignal,
): Promise<AccountCompletionEvent> => {
  const { publicKey } = await createSigner(transport).getAddress(fromDescriptorPath(source.path));
  throwIfAborted(signal);
  // The completion may run on another device than the scan: its key must control the scanned account.
  const accountIds = await getAddressesForPublicKey(currency, publicKey);
  if (!accountIds.includes(source.key)) {
    const error = new CompletionAccountMismatchError(
      "This device derives another account on this path: use the device and seed used for the scan.",
    );
    return { source, state: { type: "failed", error } };
  }
  return { source, state: { type: "completed", context: { publicKey } } };
};

/** Reads the public key of each account's path, which no device operation can check the device against once the descriptor holds only the account id; no approval is asked, so an account goes from `waiting` to its result. Any error but a mismatch stops the batch, a disconnect for the Device Intent to handle. */
export const completeAccountDescriptors: CompleteAccountDescriptors = (
  runOnTransport,
  currency,
  selected,
) =>
  concat(
    from(selected.map(source => ({ source, state: { type: "waiting" } as const }))),
    from(selected).pipe(
      concatMap(source =>
        runOnTransport((transport, signal) =>
          defer(() => completeOne(transport, currency, source, signal)),
        ),
      ),
    ),
  );
