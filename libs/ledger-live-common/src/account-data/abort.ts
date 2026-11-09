import type { Observable } from "rxjs";
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
    const onAbort = () => {
      subscription.unsubscribe();
      if (signal) reject(abortReason(signal));
    };
    const subscription = source$.subscribe({
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
    if (!subscription.closed) signal?.addEventListener("abort", onAbort, { once: true });
  });
}
