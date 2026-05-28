import { Observable, of, concat } from "rxjs";
import { catchError } from "rxjs/operators";
import type { Job } from "@ledgerhq/device-intent";
import { getSwapAPIBaseURL } from "../../../../exchange/swap";
import type {
  SubmitRfqOrderEvmIntentInput,
  SubmitRfqOrderEvmJobState,
  SubmitRfqOrderTerminalStatus,
} from "./types";

const DEFAULT_POLL_INTERVAL_MS = 5_000;
/**
 * Hard-stop after ~5 minutes of polling. The current implementation does
 * not retry; if the partner never resolves the order we surface a
 * `failed` state and let the orchestrator reject the live-app promise.
 *
 * Mirrors the 5s × 60 ≈ 5 min budget the swap-live-app uses (no upper
 * bound there — the live-app relies on the user closing the drawer to
 * cancel; the wallet-side job is more conservative).
 */
const DEFAULT_MAX_POLL_ATTEMPTS = 60;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

type SubmitResponse = {
  uniswapOrderResponse?: { orderId?: string };
  orderId?: string;
} & Record<string, unknown>;

type StatusEntry = {
  status: string;
  txHash?: string;
  swapId?: string;
  finalAmount?: string;
};

function isTerminalStatus(s: string): s is SubmitRfqOrderTerminalStatus {
  return s === "finished" || s === "refunded";
}

/**
 * Extracts the order id from the partner's submit response when the
 * planner did not precompute one. UniswapX returns it as
 * `uniswapOrderResponse.orderId`; we also tolerate the flatter `orderId`
 * shape used by other partners for resilience.
 */
function extractOrderId(response: SubmitResponse): string | undefined {
  if (response.uniswapOrderResponse?.orderId) {
    return response.uniswapOrderResponse.orderId;
  }
  if (typeof response.orderId === "string") {
    return response.orderId;
  }
  return undefined;
}

function buildSubmitObservable(
  input: SubmitRfqOrderEvmIntentInput,
): Observable<SubmitRfqOrderEvmJobState> {
  return new Observable<SubmitRfqOrderEvmJobState>(subscriber => {
    let cancelled = false;
    const fetchImpl = input.fetchImpl ?? fetch;
    const pollInterval = input.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const maxAttempts = input.maxPollAttempts ?? DEFAULT_MAX_POLL_ATTEMPTS;
    const baseURL = input.swapApiBaseURL ?? getSwapAPIBaseURL();

    (async () => {
      subscriber.next({ type: "submitting" });
      const submitResponse = await fetchImpl(
        `${baseURL}/${input.provider}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input.submitBody),
        },
      );
      if (cancelled) return;
      if (!submitResponse.ok) {
        throw new Error(
          `RFQ submit failed: HTTP ${submitResponse.status} ${submitResponse.statusText}`,
        );
      }
      const submitJson = (await submitResponse.json()) as SubmitResponse;
      if (cancelled) return;

      const orderId =
        input.precomputedOrderId ?? extractOrderId(submitJson);
      if (!orderId) {
        throw new Error(
          "RFQ submit did not return an order id and no precomputed id was provided",
        );
      }
      subscriber.next({ type: "submitted", orderId });

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (cancelled) return;
        subscriber.next({ type: "polling", orderId, pollCount: attempt });
        await delay(pollInterval);
        if (cancelled) return;

        let statusJson: StatusEntry[] | null = null;
        try {
          const statusResponse = await fetchImpl(`${baseURL}/swap/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify([
              {
                provider: input.provider,
                swapId: orderId,
                network: input.network,
              },
            ]),
          });
          if (!statusResponse.ok) {
            // Transient status-endpoint hiccups should not fail the whole
            // intent; keep polling until we hit the attempt budget.
            continue;
          }
          statusJson = (await statusResponse.json()) as StatusEntry[];
        } catch {
          continue;
        }

        const entry = statusJson?.[0];
        if (!entry) continue;
        if (isTerminalStatus(entry.status)) {
          subscriber.next({
            type: "confirmed",
            orderId,
            status: entry.status,
            txHash: entry.txHash,
            swapId: entry.swapId,
            finalAmount: entry.finalAmount,
          });
          subscriber.complete();
          return;
        }
      }

      subscriber.next({
        type: "failed",
        error: new Error(
          `RFQ order ${orderId} did not resolve after ${maxAttempts} attempts`,
        ),
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
 * Submit a signed RFQ order to the partner's swap-api `/submit` endpoint,
 * then poll `/swap/status` until the order reaches a terminal status
 * (`finished` or `refunded`).
 *
 * No device interaction is performed — `requiresConnectedDevice` on the
 * shared definition is `false`, but the orchestrator still keeps the
 * device connected from the previous signing intent so the executor
 * stays open.
 *
 * Errors during submit or polling are emitted as `failed` job states;
 * the observable always completes cleanly so the orchestrator can react
 * in `onIntentJobComplete`.
 */
export const submitRfqOrderEvmJob: Job<
  SubmitRfqOrderEvmJobState,
  SubmitRfqOrderEvmIntentInput
> = ({ input }) =>
  concat(
    of<SubmitRfqOrderEvmJobState>({ type: "submitting" }),
    buildSubmitObservable(input).pipe(
      catchError(err =>
        of<SubmitRfqOrderEvmJobState>({
          type: "failed",
          error: err instanceof Error ? err : new Error(String(err)),
        }),
      ),
    ),
  );
