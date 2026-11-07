import { SignatureRefusedError } from "@domain/api-account-transaction";
import type { Job } from "@features/platform-device-intent";
import { Observable, type Subscription } from "rxjs";
import type {
  SignAccountMessageIntentInput,
  SignAccountMessageIntentJobState,
  SignAccountMessageIntentResult,
} from "./types";

/** Signs on the executor's session with the source that serves the account; a refusal is a retryable `cancelled`. */
export const signAccountMessageIntentJob: Job<
  SignAccountMessageIntentJobState,
  SignAccountMessageIntentInput,
  SignAccountMessageIntentResult
> = ({ deviceConnectionResult, input, onResult }) =>
  new Observable<SignAccountMessageIntentJobState>(subscriber => {
    const { dmk, sessionId, compatDeviceId, compatDeviceName, connectedDevice } =
      deviceConnectionResult;
    const deviceModelId = connectedDevice.modelId;
    let inner: Subscription | undefined;
    let runToken = 0;

    const run = () => {
      const token = ++runToken;
      const current = () => token === runToken && !subscriber.closed;
      inner?.unsubscribe();
      subscriber.next({ type: "pending", deviceModelId });
      inner = input.sign({ dmk, sessionId, compatDeviceId }).subscribe({
        next: event => {
          if (!current()) return;
          switch (event.type) {
            case "device-signature-requested":
              return subscriber.next({
                type: "device-signature-requested",
                deviceModelId,
                deviceName: compatDeviceName,
              });
            case "signed":
              onResult(event.signature);
              subscriber.next({ type: "signed" });
              return subscriber.complete();
          }
        },
        complete: () => {
          if (current()) subscriber.error(new Error("Signing ended without a signature"));
        },
        error: error => {
          if (!current()) return;
          if (error instanceof SignatureRefusedError) {
            subscriber.next({ type: "cancelled", retry: run });
            return;
          }
          subscriber.error(error);
        },
      });
    };

    run();
    return () => {
      runToken += 1;
      inner?.unsubscribe();
    };
  });
