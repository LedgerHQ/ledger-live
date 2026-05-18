import type { Observable } from "rxjs";
import { setup, assign, fromObservable, createActor } from "xstate";
import { log } from "@ledgerhq/logs";
import type {
  DeviceConnectionParams,
  DeviceConnectionResult,
  DeviceExtractedContext,
  Intent,
} from "./core";
import type { ExecutorState } from "./executor";

const LOG_TYPE = "DIEStateMachine";

// ---- Listener types ----

export type StateMachineListeners<JobState, Input, ExtraProps> = {
  /**
   * Called when the executor state changes.
   */
  onExecutorStateChanged: (executorState: ExecutorState) => void;
  /**
   * Called when the job Observable emits a new value.
   */
  onIntentJobStateChanged: (
    intent: Intent<JobState, Input, ExtraProps>,
    jobState: JobState,
  ) => void;
  /**
   * Called when the job Observable completes.
   */
  onIntentJobComplete: (intent: Intent<JobState, Input, ExtraProps>) => void;
  /**
   * Called when the job Observable emits an error.
   */
  onIntentJobError: (intent: Intent<JobState, Input, ExtraProps>, error: unknown) => void;
};

// ---- Internal machine types ----

type MachineContext<JobState, Input, ExtraProps> = {
  listeners: StateMachineListeners<JobState, Input, ExtraProps>;
  deviceConnectionParams: DeviceConnectionParams;
  currentIntent: Intent<JobState, Input, ExtraProps>;
  deviceConnectionResult: DeviceConnectionResult | null;
  deviceExtractedContext: DeviceExtractedContext | null;
  error: unknown;
};

type MachineEvent<JobState, Input, ExtraProps> =
  | { type: "DEVICE_CONNECTED"; result: DeviceConnectionResult }
  | { type: "CONNECTION_ERROR"; error: unknown }
  | { type: "DEVICE_INITIALIZED"; context: DeviceExtractedContext }
  | { type: "DEVICE_DISCONNECTED" }
  | { type: "RETRY" }
  | { type: "SET_INTENT"; intent: Intent<JobState, Input, ExtraProps> }
  | { type: "REINITIALIZE" }
  | { type: "STOP_INTENT" };

type MachineInput<JobState, Input, ExtraProps> = {
  deviceConnectionParams: DeviceConnectionParams;
  intent: Intent<JobState, Input, ExtraProps>;
  listeners: StateMachineListeners<JobState, Input, ExtraProps>;
};

type JobInvokeInput<JobState, Input> = {
  job: (params: {
    deviceConnectionResult: DeviceConnectionResult;
    deviceExtractedContext: DeviceExtractedContext;
    input: Input;
  }) => Observable<JobState>;
  deviceConnectionResult: DeviceConnectionResult;
  deviceExtractedContext: DeviceExtractedContext;
  intentInput: Input;
};

// ---- Machine factory ----

function createExecutorMachine<JobState, Input, ExtraProps>() {
  /** @xstate-layout N4IgpgJg5mDOIC5QBEwDcCWBjMBJAdgC5hECiAHmFgK6ED2ATgHQTrZgDCd++VhG3AMTJSANVwdSAfQ4B5AHLzSHACqlkAbQAMAXUSgADnVgZ+3fSHKIAjNYAcAVibWAbHZcBmAOxeAnG60HOwAaEABPGy1rJg8PXzsAJi0PawAWa18vVIcAXxzQ1EwcAmIyShp6ZlYizm5eLDN8QTlFZRVcBSlSACVu2W7tPSQQIxNGiysEL1imB2y43wSEl2yXUIiEAFprBJjrZMyHLV8HbwdXPIK2YqISQgoqWkYmLDq+AXxSBgZGQW7SFTdACagwso1MHwmiC8SyYdhh-kyXkSvi0IXCiG2gSY8VSHlSXi0gUSSw8lxAhXYJTuDwqz2qVPwEIAhgAbDAAL2ZjWEYgk0lw8lw7QAggAZXAALXUoOG4PGw0mtjsvmcsQcLlRdh2KvRGxc0yYLnsLgc0zsHjsKPJlJupXu5SeVWueCZ-DZnO5H0EAGUAVJBWp5CpZYZjBDzIqbKk8TEHA5fKkEtZ46bTetELFUrMtAaUjCElarTaXdSyo9KixS26MB6uTyROJJFJkLgfS0lKoZboweGFaBJhbswl0saPElk14HBmEOqjVpUo5NXZsqcEiWamWHRX6dWWez697-oLhbhxVLSKGRn3IVGECnrB4mEkk-ivHmdjOEjNUosvBk7ECXMCXXfIKWre1aSdJgMFucsKm9CBuDAGD8DQOgAGsUNtV1IMdStYLwisPgQWD0KwL1uEGK95VvAcbBfJgCViXxEyCXx7C8GdbGsLxnx8FZHCtFwllAq5Nzg7c6WYQiaXw70wG+Z4DFZbkADNGAAWyYHCtyggjJP0kiyLoCjGmons5RvSN6KmDwXHnJYUxVFwVjSGd-wc78Unic5Eg8Y4N0ZIjpNQkLaG9Rt+RbNsOzabshjDMY6MsRAh2fUdHwnXjfxndiYnfexxxWXMVSCu05J3GTDPkoQ-RUANg1IYMaOs-AoQQeIHMCd8V181EfBnFcHKOLJEm1FVzjE8CJPCgy5u9H0VFkAAFRqgxDSykojdq7x2HZnwyBwEkyNiXC0LiMXvQJokLdJjqSXjvxccrcMq0LZPgiKhGPIVRQlaVWuSmzUqmXwn0m5IiQWOYEiG1IRou9JcQ4wrXr0-Dnk++4lIYP4AWBIGdo6-9dlcxJPBOC60jhq79gNOFXDmVy-wtMkwN0mqqrCmlcd9f1A2azbEuvYHdts9w7GfbVzp2E74xXbjcz4mXmc1BJkQ8XIOYg97oOxr4fjx37T3PQGttF4m7ziPj7CCQl-HsIS8vSZwDQuwksiOF6ddmvWCIgVkwH5hrBZai3aJBpVRyNY0NXidxHwJbjbCcHwpwp3NEy19GuY+wPg6i5tW3bBROzUTQI7ajqmbjQtMhjJIzUVumNa0OECVRLWVRjQLfeC-2sYL-GT3+i8if7UGUyiJi8TxXjHHSRc8vsJhpnfTJNSiLXUjyMD8DoVh4GGTm5sYXsxZr3i65VLIkx6luNm2cGmJXezdXHbwyv7iqvsrBkcBcB4O8EGkdxZTwyKqAk0x9jp3sIEGcmx4g4nOPGfwaC4ieFzmfZgrxgENA+Ibc+VlL53ibnCZupoMieCTO4Ia0R5htwyMsX8+JsGD2dBJfcnpJ5gJriOBypoThuB8AuZYM5shSw1o+eyDcUwwl3j-N6f8sZ52+uAvhe0MjtxOD4GM8IAoIw8okWYsQzE00JMsdhKjqqQVxhfK2tlYi7ELG-HwCQNQ7ETB5H8IkPbg3cFrdm4kB42JggXBxk8lTJifPsJYfhu5ThONxNuMQRyLkXIBNcwSZqhKkvrNCHoICyAMIpSiGjq53l-GnScAVYiEnHNYIa5wUGFUfNPS0dg945CAA */
  return setup({
    types: {
      context: {} as MachineContext<JobState, Input, ExtraProps>,
      events: {} as MachineEvent<JobState, Input, ExtraProps>,
      input: {} as MachineInput<JobState, Input, ExtraProps>,
    },
    actors: {
      executeJob: fromObservable(({ input }: { input: JobInvokeInput<JobState, Input> }) =>
        input.job({
          deviceConnectionResult: input.deviceConnectionResult,
          deviceExtractedContext: input.deviceExtractedContext,
          input: input.intentInput,
        }),
      ),
    },
    actions: {
      resetConnection: assign({
        deviceConnectionResult: () => null,
        deviceExtractedContext: () => null,
        error: () => null,
      }),
    },
  }).createMachine({
    id: "DeviceIntentExecutor",
    initial: "deviceConnection",
    context: ({ input }) => ({
      listeners: input.listeners,
      deviceConnectionParams: input.deviceConnectionParams,
      currentIntent: input.intent,
      deviceConnectionResult: null,
      deviceExtractedContext: null,
      error: null,
    }),
    states: {
      deviceConnection: {
        entry: ({ context }) => {
          log(LOG_TYPE, "state: deviceConnection");
          context.listeners.onExecutorStateChanged({ type: "connectingDevice" });
        },
        on: {
          DEVICE_CONNECTED: {
            target: "deviceInitialization",
            actions: assign({
              deviceConnectionResult: ({ event }) => event.result,
            }),
          },
          CONNECTION_ERROR: {
            target: "connectionError",
            actions: assign({ error: ({ event }) => event.error }),
          },
        },
      },
      connectionError: {
        entry: ({ context }) => {
          log(LOG_TYPE, "state: connectionError", { error: context.error });
          context.listeners.onExecutorStateChanged({
            type: "connectingDeviceError",
            error: context.error,
          });
        },
        on: {
          RETRY: {
            target: "deviceConnection",
            actions: assign({ error: () => null }),
          },
        },
      },
      deviceInitialization: {
        entry: ({ context }) => {
          log(LOG_TYPE, "state: deviceInitialization");
          context.listeners.onExecutorStateChanged({
            type: "initializingDeviceContext",
          });
        },
        on: {
          DEVICE_INITIALIZED: {
            target: "intentExecution",
            actions: assign({
              deviceExtractedContext: ({ event }) => event.context,
            }),
          },
          SET_INTENT: {
            actions: assign({ currentIntent: ({ event }) => event.intent }),
          },
          DEVICE_DISCONNECTED: {
            target: "connectionError",
            actions: "resetConnection",
          },
          REINITIALIZE: {
            target: "deviceInitialization",
            actions: assign({
              deviceExtractedContext: () => null,
              error: () => null,
            }),
          },
        },
      },
      intentExecution: {
        entry: ({ context }) => {
          log(LOG_TYPE, "state: intentExecution", {
            intent: context.currentIntent.label,
          });
          context.listeners.onExecutorStateChanged({ type: "executingIntent" });
        },
        invoke: {
          src: "executeJob",
          input: ({ context }) => ({
            job: context.currentIntent.job,
            deviceConnectionResult: context.deviceConnectionResult!,
            deviceExtractedContext: context.deviceExtractedContext!,
            intentInput: context.currentIntent.input,
          }),
          onSnapshot: {
            actions: ({ event, context }) => {
              const jobState = event.snapshot.context;
              if (jobState !== undefined) {
                context.currentIntent.onJobStateChanged?.(jobState);
                context.listeners.onIntentJobStateChanged(context.currentIntent, jobState);
              }
            },
          },
          onDone: {
            target: "idle",
            actions: ({ context }) => {
              context.currentIntent.onJobComplete?.();
              context.listeners.onIntentJobComplete(context.currentIntent);
            },
          },
          onError: {
            target: "intentError",
            actions: [
              ({ event, context }) => {
                context.currentIntent.onJobError?.(event.error);
                context.listeners.onIntentJobError(context.currentIntent, event.error);
              },
              assign({ error: ({ event }) => event.error }),
            ],
          },
        },
        on: {
          DEVICE_DISCONNECTED: {
            target: "connectionError",
            actions: "resetConnection",
          },
          SET_INTENT: {
            target: "invalidOperation",
            actions: assign({
              error: () => new Error("SET_INTENT received during intent execution"),
            }),
          },
          STOP_INTENT: "idle",
          REINITIALIZE: {
            target: "invalidOperation",
            actions: assign({
              error: () => new Error("REINITIALIZE received during intent execution"),
            }),
          },
        },
      },
      intentError: {
        entry: ({ context }) => {
          log(LOG_TYPE, "state: intentError", { error: context.error });
          console.warn(
            "[DeviceIntentExecutor] intent observable emitted an uncaught error. " +
              "Intents are expected to handle their own errors; this generic fallback " +
              "should not be reached in a correct implementation.",
            context.error,
          );
          context.listeners.onExecutorStateChanged({
            type: "executingIntentError",
            error: context.error,
          });
        },
        on: {
          RETRY: {
            target: "intentExecution",
            actions: assign({ error: () => null }),
          },
          SET_INTENT: {
            target: "intentExecution",
            actions: assign({
              currentIntent: ({ event }) => event.intent,
              error: () => null,
            }),
          },
          REINITIALIZE: {
            target: "deviceInitialization",
            actions: assign({
              deviceExtractedContext: () => null,
              error: () => null,
            }),
          },
        },
      },
      idle: {
        entry: ({ context }) => {
          log(LOG_TYPE, "state: idle");
          context.listeners.onExecutorStateChanged({ type: "idle" });
        },
        on: {
          SET_INTENT: {
            target: "intentExecution",
            actions: assign({
              currentIntent: ({ event }) => event.intent,
            }),
          },
          DEVICE_DISCONNECTED: {
            target: "connectionError",
            actions: "resetConnection",
          },
          REINITIALIZE: {
            target: "deviceInitialization",
            actions: assign({
              deviceExtractedContext: () => null,
            }),
          },
        },
      },
      invalidOperation: {
        type: "final",
        entry: ({ context }) => {
          log(LOG_TYPE, "state: invalidOperation — THIS IS A BUG", {
            error: context.error,
          });
          console.warn(
            "[DeviceIntentExecutor] executor entered an invalid state. This signals " +
              "a mistake in how the executor is integrated by the caller (e.g. swapping " +
              "intents while one is still running).",
            context.error,
          );
          context.listeners.onExecutorStateChanged({
            type: "invalidOperation",
            error: context.error,
          });
        },
      },
    },
  });
}

// ---- Public interface ----

export interface DeviceIntentExecutorStateMachine<JobState, Input, ExtraProps> {
  deviceConnected(result: DeviceConnectionResult): void;
  connectionError(error: unknown): void;
  deviceContextInitialized(context: DeviceExtractedContext): void;
  deviceDisconnected(): void;
  retry(): void;
  setIntent(intent: Intent<JobState, Input, ExtraProps>): void;
  reinitialize(): void;
  stopIntent(): void;
  stop(): void;
}

export type StateMachineConstructor<JobState, Input, ExtraProps> = new (params: {
  deviceConnectionParams: DeviceConnectionParams;
  intent: Intent<JobState, Input, ExtraProps>;
  listeners: StateMachineListeners<JobState, Input, ExtraProps>;
}) => DeviceIntentExecutorStateMachine<JobState, Input, ExtraProps>;

// ---- Default implementation ----

export class DefaultDeviceIntentExecutorStateMachine<JobState, Input, ExtraProps>
  implements DeviceIntentExecutorStateMachine<JobState, Input, ExtraProps>
{
  private readonly actor;

  constructor(params: {
    deviceConnectionParams: DeviceConnectionParams;
    intent: Intent<JobState, Input, ExtraProps>;
    listeners: StateMachineListeners<JobState, Input, ExtraProps>;
  }) {
    const machine = createExecutorMachine<JobState, Input, ExtraProps>();
    this.actor = createActor(machine, { input: params });
    this.actor.start();
  }

  // -- Component callback events --

  deviceConnected(result: DeviceConnectionResult): void {
    log(LOG_TYPE, "event: deviceConnected");
    this.actor.send({ type: "DEVICE_CONNECTED", result });
  }

  connectionError(error: unknown): void {
    log(LOG_TYPE, "event: connectionError", { error });
    this.actor.send({ type: "CONNECTION_ERROR", error });
  }

  deviceContextInitialized(context: DeviceExtractedContext): void {
    log(LOG_TYPE, "event: deviceContextInitialized", context);
    this.actor.send({ type: "DEVICE_INITIALIZED", context });
  }

  deviceDisconnected(): void {
    log(LOG_TYPE, "event: deviceDisconnected");
    this.actor.send({ type: "DEVICE_DISCONNECTED" });
  }

  retry(): void {
    log(LOG_TYPE, "event: retry");
    this.actor.send({ type: "RETRY" });
  }

  // -- Caller-driven events --

  setIntent(intent: Intent<JobState, Input, ExtraProps>): void {
    log(LOG_TYPE, "event: setIntent", { label: intent.label });
    this.actor.send({ type: "SET_INTENT", intent });
  }

  reinitialize(): void {
    log(LOG_TYPE, "event: reinitialize");
    this.actor.send({ type: "REINITIALIZE" });
  }

  stopIntent(): void {
    log(LOG_TYPE, "event: stopIntent");
    this.actor.send({ type: "STOP_INTENT" });
  }

  // -- Cleanup --

  stop(): void {
    log(LOG_TYPE, "event: stop");
    this.actor.stop();
  }
}
