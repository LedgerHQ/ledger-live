import { SignatureRefusedError, type SignedSend } from "@domain/api-account-transaction";
import type { Job } from "@features/platform-device-intent";
import { Observable, type Subscription } from "rxjs";
import type {
  SignAccountTransactionIntentInput,
  SignAccountTransactionIntentJobState,
} from "./types";

/** Signs on the executor's session with the source that prepared; a refusal is a retryable `cancelled`. */
export const signAccountTransactionIntentJob: Job<
  SignAccountTransactionIntentJobState,
  SignAccountTransactionIntentInput,
  SignedSend
> = ({ deviceConnectionResult, input, onResult }) =>
  new Observable<SignAccountTransactionIntentJobState>(subscriber => {
    const { dmk, sessionId, compatDeviceId, connectedDevice } = deviceConnectionResult;
    const deviceModelId = connectedDevice.modelId;
    let inner: Subscription | undefined;
    let runToken = 0;

    const fail = (error: Error) => {
      subscriber.next({ type: "error", error });
      subscriber.complete();
    };

    const run = () => {
      if (subscriber.closed) return;
      const token = ++runToken;
      const current = () => token === runToken && !subscriber.closed;
      inner?.unsubscribe();
      subscriber.next({ type: "pending", deviceModelId });
      inner = input.sign({ dmk, sessionId, compatDeviceId, deviceModelId }).subscribe({
        next: event => {
          if (!current()) return;
          switch (event.type) {
            case "device-signature-requested":
              return subscriber.next({ type: "device-signature-requested", deviceModelId });
            case "device-streaming":
              return subscriber.next({ type: "device-streaming", progress: event.progress });
            case "device-signature-granted":
              return subscriber.next({ type: "device-signature-granted" });
            case "signed":
              onResult(event.signed);
              subscriber.next({ type: "signed" });
              return subscriber.complete();
          }
        },
        complete: () => {
          if (current()) fail(new Error("Signing ended without a signature"));
        },
        error: error => {
          if (!current()) return;
          if (error instanceof SignatureRefusedError) {
            subscriber.next({ type: "cancelled", retry: run });
            return;
          }
          fail(error instanceof Error ? error : new Error(String(error)));
        },
      });
    };

    run();
    return () => {
      runToken += 1;
      inner?.unsubscribe();
    };
  });
