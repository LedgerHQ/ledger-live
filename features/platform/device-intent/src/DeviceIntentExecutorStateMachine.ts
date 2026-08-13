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
  /** @xstate-layout N4IgpgJg5mDOIC5QBEwDcCWBjMBJAdgC5hECiAHmFgK6ED2ATgHQTrZgDCd++VhG3AMTJSANVwdSAfQ4B5AHLzSHACqlkAbQAMAXUSgADnVgZ+3fSHKIAjNYAcAVibWAbHZcBmAOxeAnG60HOwAaEABPGy1rJg8PXzsAJi0PawAWa18vVIcAXxzQ1EwcAmIyShp6ZlYisGQMWCxuXixiCEEAJVIVdoBNbT0kECMTM3wLKwQ7XyctVPTfeKSEjwcvUIiEBJcmTN9vVJd7VK1HXPyQQvYSkkIKKlpGFjZi-FMMAEMAGwwAL3fR4RiCTSXDyXAqXAAQQAMrgAFrqfoWYZvcyDCa2KbOWIOFy+E7WBJTELhRAuLweJiHdyrDx2OmJXx5ArPPBEG53CqPapXV78L6-f4CfCCADKXSkoLU8hUSMGKNG4xsc0pKwcvlSCWsDlxuvWiFiqSYDi05JSXgSRLs1uZF1Z1zK90qTxqBDeAr+AJE4kkUmQuFFckUyjUml0yOMqLG6MQ9KNCXShw8S2sXgc+oQOKps0ceLs2QcydtlxepVu5QeVXtfI+309wo6pFB4KhsIRcsMkcVMYQ2uslKSmo8qS8ZsJGeWlNSvgSXgydkCppHCWL1bLnMrTAw7MdFQbEG4YC3+DQdAA1keS2z1xXndub07hQht6esELuP0O0Mu8Klb3B0wI6xAs2RTPYaykr2theEws6jqkjjWi4lorucV4OuWTqPPeHK3g2YAMAwjwGJ8-wAGaMAAtkw6E7phXLMDhu60E+L50G+oyfuG8o-mioATBS2wuFolralMLguOkqQZnO2yTvODj2MsWhMmha64VhjF0RuXpAr6-qBgoSiqIi3GdiMv49nGsGJv2KZZL4GZBL4MSjvYyaSaaUyrq62m3thfmPkI4oqJKMqkDKX4KpZ-GIPE2yBKO+bxOqWg+Bm+bbCaWSJHY9jTISPm8g+DHHiVLHBSosgAAphdKspmd+Fl8ZYNhagksEZA4CS7NkwkQRs1iBNERLpN1SSpssLhFaWGmlUx9EVSKnTNhCMLwqQUW8dGsUIH4lJTCaHhaMkCwOJqGUHMaaXzMlqaHDN15zZuC2kIRjCNt0fSNdFLUCYSVJuFscTZWkCQZkN5JMHlLjnRJM5ePSHiPRhOkBeu70MGKEpShFDUDOZUZ-u4diwTDUSWtMQTSZBkMwTDcN4rO9JnCyvnlXe2mY42q2thtW3NTtrWZpkziIV4KnUohTnpM45JpRLWQmtNans89d4QJ8YDY6FuORT921-mkriA9qebuP2I4Q7YTg+GmiTCXiqQrCjgXzZr2vesCfoBkGxmhgLRM9q4TgrESmRzEkqz5hDs5aNDI74isUxzCprsc9hHs82Ca1tptBuC0bJrRCqzupo4UkkhsimkxSo6ZHiUQrKkeTnPgdCsPAgy0RnDARoXwepjE3VTFkmqJTHkEALT2Ns9JbLYImuKOyzp+r3KslwPB8DFTVB7ttgLIBPgpArc4Lum0-xDsik6v4d9xJ4a-Mc6PI4HUDRNHwkD9-vwuZUwG6w5VgajpIjDMR8th2BPvmLUhw0rP0Wq-as7o6zviFr9IWGIExCXVLiaBEtNQuAzKBWCc5Yh4iyNqC0LdVbFXXlpDmu9MFGwyPHaYPg5jQOOgcGSiRjSxEEWDCWWxEFo0YRyTGv9uy7ViB1K0zsfAJFxISDUMlYiAWQgrPY7gVjIzobNF+mctbSN3tg-szgRKzj2EENM0xY4SxiAmBCCEL7Jn0WzehRitJoAFBAWQBgCLoNMX9RA05bZagpMkbwyQtQZUUjfNy-ZtTJBtK3IAA */
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
      notifyDeviceDisconnected: ({ context }) => {
        context.listeners.onExecutorStateChanged({
          type: "deviceDisconnected",
          device: context.deviceConnectionResult!.connectedDevice,
        });
      },
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
        },
      },
      deviceDisconnected: {
        entry: () => {
          log(LOG_TYPE, "state: deviceDisconnected");
        },
        on: {
          RETRY: {
            target: "deviceConnection",
          },
        },
      },
      deviceInitialization: {
        entry: ({ context }) => {
          log(LOG_TYPE, "state: deviceInitialization");
          context.listeners.onExecutorStateChanged({
            type: "initializingDeviceContext",
            // Set by the `DEVICE_CONNECTED` action; non-null when this state is entered.
            connectionResult: context.deviceConnectionResult!,
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
            target: "deviceDisconnected",
            actions: ["notifyDeviceDisconnected", "resetConnection"],
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
          context.listeners.onExecutorStateChanged({
            type: "executingIntent",
            // Set by the `DEVICE_INITIALIZED` action; non-null when this state is entered.
            connectionResult: context.deviceConnectionResult!,
            extractedContext: context.deviceExtractedContext!,
          });
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
            target: "deviceDisconnected",
            actions: ["notifyDeviceDisconnected", "resetConnection"],
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
            // Connection / context are NOT reset on the path into intentError, so
            // both are still set from the previous successful initialization.
            connectionResult: context.deviceConnectionResult!,
            extractedContext: context.deviceExtractedContext!,
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
            target: "deviceDisconnected",
            actions: ["notifyDeviceDisconnected", "resetConnection"],
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
  start(): void;
  deviceConnected(result: DeviceConnectionResult): void;
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

export class DefaultDeviceIntentExecutorStateMachine<
  JobState,
  Input,
  ExtraProps,
> implements DeviceIntentExecutorStateMachine<JobState, Input, ExtraProps> {
  private readonly actor;
  private hasStarted = false;

  constructor(params: {
    deviceConnectionParams: DeviceConnectionParams;
    intent: Intent<JobState, Input, ExtraProps>;
    listeners: StateMachineListeners<JobState, Input, ExtraProps>;
  }) {
    const machine = createExecutorMachine<JobState, Input, ExtraProps>();
    this.actor = createActor(machine, { input: params });
  }

  start(): void {
    if (this.hasStarted) {
      throw new Error("DeviceIntentExecutorStateMachine has already been started");
    }
    log(LOG_TYPE, "event: start");
    this.hasStarted = true;
    this.actor.start();
  }

  // -- Component callback events --

  deviceConnected(result: DeviceConnectionResult): void {
    log(LOG_TYPE, "event: deviceConnected");
    this.actor.send({ type: "DEVICE_CONNECTED", result });
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
    if (this.hasStarted) {
      this.actor.stop();
    }
  }
}
