import { isDeviceDisconnectedError, type Job } from "@features/platform-device-intent";
import { Observable, type Subscription } from "rxjs";
import { getBindingTypedData, isBindingSigner } from "../binding";
import { PredictionsBindingSignerMismatch } from "../errors";
import type {
  PredictionsBindingIntentInput,
  PredictionsBindingJobState,
  PredictionsBindingResult,
} from "./types";

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/** A device failure is a state with a retry; a lost connection is left to the executor. */
export const predictionsBindingJob: Job<
  PredictionsBindingJobState,
  PredictionsBindingIntentInput,
  PredictionsBindingResult
> = ({ deviceConnectionResult, input, onResult }) =>
  new Observable<PredictionsBindingJobState>(subscriber => {
    const { address, signTypedData } = input;
    const typedData = getBindingTypedData(address);
    let signing: Subscription | undefined;

    const showSigning = (isAwaitingConfirmation: boolean) => {
      subscriber.next({
        type: "signing",
        deviceModelId: deviceConnectionResult.connectedDevice.modelId,
        deviceName: deviceConnectionResult.compatDeviceName,
        isAwaitingConfirmation,
      });
    };

    const sign = () => {
      signing?.unsubscribe();
      let isAwaitingConfirmation = false;
      showSigning(isAwaitingConfirmation);
      signing = signTypedData(deviceConnectionResult, typedData).subscribe({
        next: event => {
          if (event.type === "awaiting-confirmation") {
            if (isAwaitingConfirmation) return;
            isAwaitingConfirmation = true;
            showSigning(isAwaitingConfirmation);
            return;
          }
          if (!isBindingSigner(address, typedData, event.signature)) {
            // The signer stays out: it can be another of the user's accounts, which the live
            // app never saw.
            onResult({
              type: "mismatch",
              error: new PredictionsBindingSignerMismatch(`The binding isn't signed by ${address}`),
            });
            subscriber.next({ type: "mismatch" });
            subscriber.complete();
            return;
          }
          onResult({ type: "bound", answer: { typedData, signature: event.signature } });
          subscriber.complete();
        },
        error: (error: unknown) => {
          // The executor shows a lost connection itself, and runs the binding again once back.
          if (isDeviceDisconnectedError(error)) {
            subscriber.error(error);
            return;
          }
          subscriber.next({ type: "error", error: toError(error), retry: sign });
        },
      });
    };

    sign();

    return () => {
      signing?.unsubscribe();
    };
  });
