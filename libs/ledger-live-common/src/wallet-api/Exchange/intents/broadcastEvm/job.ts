import { Observable, of, concat } from "rxjs";
import { catchError } from "rxjs/operators";
import { getNodeApi } from "@ledgerhq/coin-evm/network/node/index";
import type { Job } from "@ledgerhq/device-intent";
import { getCryptoCurrencyById } from "../../../../currencies";
import type { BroadcastEvmIntentInput, BroadcastEvmJobState } from "./types";

const POLL_INTERVAL_MS = 3000;
/**
 * Hard-stop after ~5 minutes of polling. The current implementation never
 * retries; if the receipt never lands we surface a `failed` state and let
 * the orchestrator reject the live-app promise.
 *
 * Task 6 of the productionisation plan replaces this hand-rolled loop with
 * coin-evm's confirmation primitives.
 */
const MAX_POLL_ATTEMPTS = 100;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildBroadcastObservable(
  input: BroadcastEvmIntentInput,
): Observable<BroadcastEvmJobState> {
  return new Observable<BroadcastEvmJobState>(subscriber => {
    let cancelled = false;

    (async () => {
      // The `broadcasting` state is emitted synchronously by the outer
      // `concat(of(...), ...)` wrapper below; we go straight to the actual
      // broadcast call here to avoid a duplicate transition.
      const currency = getCryptoCurrencyById(input.currencyId);
      const nodeApi = getNodeApi(currency);

      const hash = await nodeApi.broadcastTransaction(currency, input.signedTxHex);
      if (cancelled) return;
      subscriber.next({ type: "broadcasted", hash });

      for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt++) {
        if (cancelled) return;
        subscriber.next({ type: "waiting-receipt", hash, pollCount: attempt });
        await delay(POLL_INTERVAL_MS);
        if (cancelled) return;

        let info: Awaited<ReturnType<typeof nodeApi.getTransaction>> | null = null;
        try {
          info = await nodeApi.getTransaction(currency, hash);
        } catch {
          // Some nodes return 404 for not-yet-mined txs — keep polling instead
          // of failing the whole intent on transient lookup errors.
          continue;
        }

        if (info.blockHeight !== undefined) {
          if (info.status === 0) {
            subscriber.next({
              type: "failed",
              error: new Error(`Transaction ${hash} reverted on chain`),
            });
            subscriber.complete();
            return;
          }
          subscriber.next({ type: "confirmed", hash, blockHeight: info.blockHeight });
          subscriber.complete();
          return;
        }
      }

      subscriber.next({
        type: "failed",
        error: new Error(`Transaction ${hash} not mined after ${MAX_POLL_ATTEMPTS} attempts`),
      });
      subscriber.complete();
    })().catch(err => {
      if (cancelled) return;
      subscriber.next({
        type: "failed",
        error: err instanceof Error ? err : new Error(String(err)),
      });
      subscriber.complete();
    });

    return () => {
      cancelled = true;
    };
  });
}

/**
 * Broadcast a signed EVM transaction and poll the node until the receipt is
 * available.
 *
 * No device interaction is performed — `requiresConnectedDevice` on the
 * shared definition is `false`, but the orchestrator still keeps the device
 * connected from the previous signing intent so the executor stays open.
 *
 * Errors during broadcast or polling are emitted as `failed` job states; the
 * observable always completes cleanly so the orchestrator can react in
 * `onIntentJobComplete`.
 */
export const broadcastEvmJob: Job<BroadcastEvmJobState, BroadcastEvmIntentInput> = ({ input }) =>
  concat(
    of<BroadcastEvmJobState>({ type: "broadcasting" }),
    buildBroadcastObservable(input).pipe(
      catchError(err =>
        of<BroadcastEvmJobState>({
          type: "failed",
          error: err instanceof Error ? err : new Error(String(err)),
        }),
      ),
    ),
  );
