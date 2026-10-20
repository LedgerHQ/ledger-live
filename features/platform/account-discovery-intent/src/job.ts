import type { Job } from "@features/platform-device-intent";
import { discoverAccounts, type DiscoveredAccount } from "@features/platform-account-discovery";
import { Observable } from "rxjs";
import type {
  AccountDiscoveryIntentInput,
  AccountDiscoveryIntentJobState,
  AccountDiscoveryIntentResult,
} from "./types";

/**
 * Discovers the accounts of a currency with the device app the executor opened (DIE Phase 2).
 * The job stays signer-agnostic: the host gives `createDerive` per app, and `exists` from its
 * account data router.
 */
export const accountDiscoveryIntentJob: Job<
  AccountDiscoveryIntentJobState,
  AccountDiscoveryIntentInput,
  AccountDiscoveryIntentResult
> = ({ deviceConnectionResult, input, onResult }) =>
  new Observable<AccountDiscoveryIntentJobState>(subscriber => {
    const { options, createDerive, exists } = input;
    const discovered: DiscoveredAccount[] = [];
    subscriber.next({ type: "scanning", discovered: [] });
    const subscription = discoverAccounts(
      { derive: createDerive(deviceConnectionResult), exists },
      options,
    ).subscribe({
      next: account => {
        discovered.push(account);
        subscriber.next({ type: "scanning", discovered: [...discovered] });
      },
      error: error => subscriber.error(error),
      complete: () => {
        onResult(discovered);
        subscriber.next({ type: "done", discovered });
        subscriber.complete();
      },
    });
    return () => subscription.unsubscribe();
  });
