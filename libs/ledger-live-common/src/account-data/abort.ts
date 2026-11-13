import type { Observable, Subscription } from "rxjs";
import { abortReason } from "@domain/api-account-data";

/** The last value of `source$` (or `defaultValue`); aborting unsubscribes, releasing a device or a sync. */
export function lastValueUntilAborted<T>(
  source$: Observable<T>,
  signal: AbortSignal | undefined,
  defaultValue?: T,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortReason(signal));
      return;
    }
    let last = defaultValue;
    let hasValue = defaultValue !== undefined;
    let subscription: Subscription | undefined;
    // Listening before subscribing: a source may abort the signal while it subscribes.
    const onAbort = () => {
      subscription?.unsubscribe();
      if (signal) reject(abortReason(signal));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
    subscription = source$.subscribe({
      next: value => {
        last = value;
        hasValue = true;
      },
      error: (error: unknown) => {
        signal?.removeEventListener("abort", onAbort);
        reject(error);
      },
      complete: () => {
        signal?.removeEventListener("abort", onAbort);
        if (hasValue && last !== undefined) resolve(last);
        else reject(new Error("The observable completed without a value"));
      },
    });
    if (signal?.aborted) subscription.unsubscribe();
  });
}
