import { Subject } from "rxjs";

export let mockedEvents = new Subject();
const registeredAppStateCallbacks = [];
const registeredEventBridgeCallbacks = [];

export class MockEventListener {
  static flush = () => {
    mockedEvents = new Subject();
    registeredAppStateCallbacks.length = 0;
    registeredEventBridgeCallbacks.length = 0;
  };
  constructor() {
    mockedEvents.subscribe({
      next: ([type, e]: any) => {
        const targets =
          type === "change"
            ? registeredAppStateCallbacks
            : registeredEventBridgeCallbacks;
        targets
          .filter(Boolean)
          .forEach((registeredCallback: (any) => unknown) => {
            registeredCallback(e);
          });
      },
    });
  }

  addListener = (type, callback): any => {
    const target: any =
      type === "change"
        ? registeredAppStateCallbacks
        : registeredEventBridgeCallbacks;

    target.push(callback);
    const index = target.length - 1;
    return {
      remove: () => {
        target[index] = undefined;
      },
    };
  };

  addEventListener = this.addListener;
}

export function Throwable(message) {
  this.error = message;
  this.message = message;
  this.name = message;
}

export const NativeModules = (() => {
  let isConnected = false;
  let shouldFailFirstAttempt = true;

  return {
    HwTransportReactNativeBle: {
      // Stubs since we don't interact with the Native side in these tests.
      listen: async (): Promise<boolean> => {
        if (shouldFailFirstAttempt) {
          shouldFailFirstAttempt = false;
          throw new Throwable("cant-open-device");
        }
        return true;
      },
      stop: async (): Promise<boolean> => true,
      onAppStateChange: (): boolean => true,
      isConnected: async (): Promise<boolean> => isConnected,
      disconnect: async (): Promise<boolean> => {
        await new Promise((r) => setTimeout(r, 100)); // Fake delay to cover isDisconnecting
        return true;
      },
      queue: async (): Promise<boolean> => true,
      runner: async (): Promise<boolean> => true,
      observeBluetooth: async (): Promise<boolean> => true,
      exchange: async (input): Promise<string> => {
        if (input === "b001000000") {
          return "0105424f4c4f5305312e362e3001029000";
        } else {
          throw new Throwable("cant-open-device");
        }
      },
      connect: async (id: string): Promise<string> => {
        isConnected = false;
        if (id === "shouldFail") {
          throw new Throwable("cant-open-device");
        } else if (id === "alreadyConnected") {
          isConnected = true;
        }
        return id;
      },
    },
  };
})();

export const NativeEventEmitter = function MockNativeEventEmitter() {
  return new MockEventListener();
};

export const AppState = new MockEventListener();
