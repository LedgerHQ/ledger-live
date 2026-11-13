import { Observable, type Subscription } from "rxjs";
import type {
  ScanAccountsIntentJobState,
  ScanAccountsIntentResult,
  ScanAccountsJobParams,
} from "./types";

function toScanError(error: unknown): Error {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" ? error : "Scan accounts failed");
}

export function scanAccountsIntentJob<Item>({
  deviceConnectionResult,
  input,
  onResult,
}: ScanAccountsJobParams<Item>): Observable<ScanAccountsIntentJobState<Item>> {
  return new Observable(subscriber => {
    const items: Item[] = [];
    let settled = false;
    let inner: Subscription | undefined;

    const finish = (
      stateFor: (found: ScanAccountsIntentResult<Item>) => ScanAccountsIntentJobState<Item>,
      reportResult: boolean,
    ) => {
      if (settled) return;
      settled = true;
      inner?.unsubscribe();
      if (subscriber.closed) return;
      const found = [...items];
      if (reportResult) {
        try {
          onResult(found);
        } catch (error) {
          subscriber.next({ type: "error", error: toScanError(error), items: found });
          subscriber.complete();
          return;
        }
      }
      subscriber.next(stateFor(found));
      subscriber.complete();
    };

    const stop = () => {
      finish(found => ({ type: "done", items: found }), true);
    };

    subscriber.next({ type: "scanning", items: [], stop });
    if (settled || subscriber.closed) {
      return () => {
        settled = true;
      };
    }

    try {
      inner = input.startScan(deviceConnectionResult).subscribe({
        next: item => {
          if (settled) return;
          if (subscriber.closed) {
            settled = true;
            return;
          }
          items.push(item);
          subscriber.next({ type: "scanning", items: [...items], stop });
        },
        error: error => {
          finish(found => ({ type: "error", error: toScanError(error), items: found }), false);
        },
        complete: () => {
          finish(found => ({ type: "done", items: found }), true);
        },
      });
    } catch (error) {
      finish(found => ({ type: "error", error: toScanError(error), items: found }), false);
    }

    if (settled) inner?.unsubscribe();

    return () => {
      settled = true;
      inner?.unsubscribe();
    };
  });
}
