import type { Job } from "@features/platform-device-intent";
import { discoverAccounts, type DiscoveredAccount } from "@features/platform-account-discovery";
import { Observable } from "rxjs";
import type {
  AccountDiscoveryIntentInput,
  AccountDiscoveryIntentJobState,
  AccountDiscoveryIntentResult,
} from "./types";

/** Discovers accounts on the app the executor opened; a failure is an `error` state, never an observable error. */
export const accountDiscoveryIntentJob: Job<
  AccountDiscoveryIntentJobState,
  AccountDiscoveryIntentInput,
  AccountDiscoveryIntentResult
> = ({ deviceConnectionResult, input, onResult }) =>
  new Observable<AccountDiscoveryIntentJobState>(subscriber => {
    const { options, createDerive, readStatus } = input;
    const discovered: DiscoveredAccount[] = [];
    subscriber.next({ type: "scanning", discovered: [] });
    const fail = (error: unknown) => {
      subscriber.next({
        type: "error",
        error: error instanceof Error ? error : new Error(String(error)),
        discovered,
      });
      subscriber.complete();
    };
    let derive;
    try {
      derive = createDerive(deviceConnectionResult);
    } catch (error) {
      fail(error);
      return undefined;
    }
    const subscription = discoverAccounts({ derive, readStatus }, options).subscribe({
      next: account => {
        discovered.push(account);
        subscriber.next({ type: "scanning", discovered: [...discovered] });
      },
      error: fail,
      complete: () => {
        onResult(discovered);
        subscriber.next({ type: "done", discovered });
        subscriber.complete();
      },
    });
    return () => subscription.unsubscribe();
  });
