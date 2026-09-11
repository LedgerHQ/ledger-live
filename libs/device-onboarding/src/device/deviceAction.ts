import {
  DeviceActionStatus,
  type DeviceActionIntermediateValue,
  type ExecuteDeviceActionReturnType,
} from "@ledgerhq/device-management-kit";
import type { Subscription } from "rxjs";

export class DeviceActionStoppedError extends Error {
  readonly _tag = "DeviceActionStoppedError";

  constructor() {
    super("The device action stopped before producing an output");
  }
}

export type DeviceActionRunner<Output> = {
  run(): Promise<Output>;
  stop(): void;
};

/**
 * Turns a device action, an observable of intermediate states, into the promise the retry helper
 * can wrap. `stop` cancels before it unsubscribes, since DMK reports the stop from `cancel` and an
 * unsubscribed run would never settle, and is what a retry calls before the next attempt.
 */
export function createDeviceActionRunner<
  Output,
  Error,
  IntermediateValue extends DeviceActionIntermediateValue,
>(
  start: () => ExecuteDeviceActionReturnType<Output, Error, IntermediateValue>,
  onIntermediateValue?: (value: IntermediateValue) => void,
): DeviceActionRunner<Output> {
  let execution: ExecuteDeviceActionReturnType<Output, Error, IntermediateValue> | undefined;
  let subscription: Subscription | undefined;

  const stop = () => {
    execution?.cancel();
    subscription?.unsubscribe();
    subscription = undefined;
    execution = undefined;
  };

  const run = () =>
    new Promise<Output>((resolve, reject) => {
      stop();
      execution = start();
      subscription = execution.observable.subscribe({
        next: state => {
          switch (state.status) {
            case DeviceActionStatus.Pending:
              onIntermediateValue?.(state.intermediateValue);
              break;
            case DeviceActionStatus.Completed:
              resolve(state.output);
              break;
            case DeviceActionStatus.Error:
              reject(state.error);
              break;
            case DeviceActionStatus.Stopped:
              reject(new DeviceActionStoppedError());
              break;
          }
        },
        error: reject,
        complete: () => reject(new DeviceActionStoppedError()),
      });
    });

  return { run, stop };
}
