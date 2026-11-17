import type {
  DeviceConnectionResult,
  DeviceExtractedContext,
} from "@features/platform-device-intent";
import { DeviceModelId as DMKDeviceModelId } from "@ledgerhq/device-management-kit";

export const deviceConnectionResult: DeviceConnectionResult = {
  dmk: null as unknown as DeviceConnectionResult["dmk"],
  sessionId: "session-1",
  connectedDevice: {
    modelId: DMKDeviceModelId.NANO_X,
  } as DeviceConnectionResult["connectedDevice"],
  compatDeviceId: "device-1",
  compatDeviceName: "Device 1",
  compatDeviceWired: true,
};

export const deviceExtractedContext: DeviceExtractedContext = {
  currentOsVersion: "2.4.0",
  osUpdateAvailable: false,
  currentAppName: "Exchange",
  currentAppVersion: "3.5.0",
};

/** Collects what a job emits until it completes, or until `count` states arrived. */
export function collectStates<State>(job$: import("rxjs").Observable<State>): {
  states: State[];
  completed: () => boolean;
  unsubscribe: () => void;
} {
  const states: State[] = [];
  let isCompleted = false;
  const subscription = job$.subscribe({
    next: state => states.push(state),
    complete: () => {
      isCompleted = true;
    },
  });
  return {
    states,
    completed: () => isCompleted,
    unsubscribe: () => subscription.unsubscribe(),
  };
}

/** Settles every pending promise chain: microtasks all run before the next macrotask. */
export function flushPromises(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}
