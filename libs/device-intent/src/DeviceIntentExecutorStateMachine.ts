import type { Observable } from "rxjs";
import { setup, assign, fromObservable, createActor } from "xstate";
import { log } from "@ledgerhq/logs";
import type {
  DeviceConnectionParams,
  DeviceConnectionResult,
  DeviceExtractedContext,
  Intent,
  RequiredDeviceContext,
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
  requiredDeviceContext: RequiredDeviceContext;
  currentIntent: Intent<JobState, Input, ExtraProps>;
  deviceConnectionResult: DeviceConnectionResult | null;
  deviceExtractedContext: DeviceExtractedContext | null;
  error: unknown;
};

type MachineEvent<JobState, Input, ExtraProps> =
  | { type: "DEVICE_CONNECTED"; result: DeviceConnectionResult }
  | { type: "CONNECTION_ERROR"; error: unknown }
  | { type: "DEVICE_CONTEXT_INITIALIZED"; context: DeviceExtractedContext }
  | { type: "INITIALIZATION_ERROR"; error: unknown }
  | { type: "DEVICE_DISCONNECTED" }
  | { type: "RETRY" }
  | { type: "SET_INTENT"; intent: Intent<JobState, Input, ExtraProps> }
  | { type: "SET_REQUIRED_CONTEXT"; context: RequiredDeviceContext }
  | { type: "STOP_INTENT" };

type MachineInput<JobState, Input, ExtraProps> = {
  deviceConnectionParams: DeviceConnectionParams;
  requiredDeviceContext: RequiredDeviceContext;
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
  /** @xstate-layout N4IgpgJg5mDOIC5QBEwDcCWBjMBJAdgC5hECiAHmFgK6ED2ATgHQTrZgDCd++VhG3AMTJSANVwdSAfQ4B5AHLzSHACqlkAbQAMAXUSgADnVgZ+3fSHKIAjNYAcAVibWAbHZcBmAOxeAnG60HOwAaEABPGy1rJg8PXzsAJi0PawAWa18vVIcAXxzQ1EwcAmIyShp6ZlYizm5eLDN8QTlFZRVcBSlSACVu2W7tPSQQIxNGiysEL1imBw83BzSEu2svF2tQiIQAWictf0CHNes4hIyPXPyQQvYSkkIKKlpGJiw6vgF8UgYGRkFu0gqboATUGFlGpk+E0QXgys18vlcHmSsORG3CiG28SYqWW+1iCRcqUcCTyBTYxSI90eFRe1Vu+EhAEMADYYABeTMawjEEmkLTUAA0VFJcPJcO0AIIAGVwAC11GDhhDxsNJrZUr4mD4tElTnYvAbNogXAkvExTWstMlkQ4HKkydcKXgqWUnpUWM6CMy2ZzuWKJbgZfLJe1Oj0+gNdODjJDzGqbN4nHYtH5rA4EvMtI4QhiEMiXExM3EfNYEulCQ6rjdKaUHuVnlUvYz+KyOVzPoIAMqA0XyNT9pWGWOq0DqhypmKJVK61ypFK+BzGhAzuw47zE2K2vWOmsuus0xuemre1u+jtCETiSRSZC4LstJSqRXR5UjqEJhB2DypIvpdYeEkZxeEueaxE4LhaMSDguPE2RzKS1bNgeDYehgLYYG2fqfN8vwMP8gIgkOIzvvGY6Jt4RaZLqbh2AaazLkkhaLokQSzqksG6ruyHUqhLzoSh7qdhA3BgEw6FoHQADWYl7ncbq0swAm8UJ3AIBJdBYBe+CDMRKofuRCBllBOLTHEvjZHYiJGnmtirEWPhEjm7gJK53Enq69buvxnmHtyYA-C8BgslyABmjAALZMHJvl8UpsWqfg6n4JJWmNLpr7DmMBmWDC8wWrqZxBP4RJpMusKFsWGSOPYmb7O5DKCYp4kJRUnZXnyt73o+bQvkMWVxvg0Jfj+f6uCcQGrJqy7FTExzfpWWhuL4DW1ipzXKQptCdj2IpigOKh6aRQ2fv45rLOmCSIn4ZreMudjErMsQrGZiRpKt+7rUem1eW1Qi7VIAIAIoAKq4ACyAyAoQqHZlJHZWRuVTIB2pXROhIpHEGT3Y9cweC9z1nFW5IeU132tdt-0qLIAAKfYHUdCMnYZZZlkWGQZpkFkwamy7WIE0TLOkGZJKsmYuB98m-eTB6BfhAJAqCcP6YjkywgkFpuBji6pksfNLeaKwuPaLiwWa34eJLFNob5cvdr2+2kIOyvHcN7hrhdkFlmjQSpPrLiG64Jtm4aFxW2TNuy3h9sisDYMQ1D-akMKjODcNGa-l45YJEEpsPSs6JbMSWqpI5sHzKLkES0hpNfWhEAsmAMf007sP9fDaefmkfgWt+0xsdMsFeHz-NagbZwB-BHHh3X-EN03ANx+D6iJzDqejkj6amkw1rJBdrleLqHh82aJcOPEUFAfOxNOrXW3143PLXtId4PgoT5qJoLtM8NQcxBmVksi4kCIaP2tkzRaCYA9PwyRiqpBnCtR0+A6CsHgMMGKEdGAxh-l3eyFxliZHgUkI4D1lzbHsIWbIW8Uh2nsBZS2NdGqzybDULgPAPiIxVszTeGQS4+BSKmUsKZQJbCxGuRc6Zz7G3PnETwM974vDeOwhoOE5bYM7izBEUClq6hnEsTUd0wJal8PMACFk1jczsPI6WHp6SUh9O2DeXDf4ZHNDOAspoyx2nLMubIJd5zpmsoseIRxrF+R8g47C3BcJYLfDglmmoNaeE8PaK685YK5i2K45wywFyl3cCkLIYS4otQjjlZxuDfCQMXD4eBBpkQcXKokJ6W4Ui4kPoSYp3l4pR1iQNDekwCRFjovOHwOd1hpPKjMDiSQfAmIKXMLpG157qIGTYM4HhnCFT8BcA058RHrMPjEcsxJiTCMAgwkmTCFHxTQG2CAsgDABW0qsnKkxNROCzqsZEsRD6AULogGqTAanrBOOmZIdE8h5CAA */
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
      requiredDeviceContext: input.requiredDeviceContext,
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
          log(LOG_TYPE, "state: deviceInitialization", {
            requiredContext: context.requiredDeviceContext,
          });
          context.listeners.onExecutorStateChanged({
            type: "initializingDeviceContext",
          });
        },
        on: {
          DEVICE_CONTEXT_INITIALIZED: {
            target: "intentExecution",
            actions: assign({
              deviceExtractedContext: ({ event }) => event.context,
            }),
          },
          INITIALIZATION_ERROR: {
            target: "initializationError",
            actions: assign({ error: ({ event }) => event.error }),
          },
          SET_INTENT: {
            actions: assign({ currentIntent: ({ event }) => event.intent }),
          },
          DEVICE_DISCONNECTED: {
            target: "connectionError",
            actions: "resetConnection",
          },
        },
      },
      initializationError: {
        entry: ({ context }) => {
          log(LOG_TYPE, "state: initializationError", { error: context.error });
          context.listeners.onExecutorStateChanged({
            type: "initializingDeviceContextError",
            error: context.error,
          });
        },
        on: {
          RETRY: {
            target: "deviceInitialization",
            actions: assign({ error: () => null }),
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
          SET_REQUIRED_CONTEXT: {
            target: "invalidOperation",
            actions: assign({
              error: () => new Error("SET_REQUIRED_CONTEXT received during intent execution"),
            }),
          },
          STOP_INTENT: "idle",
        },
      },
      intentError: {
        entry: ({ context }) => {
          log(LOG_TYPE, "state: intentError", { error: context.error });
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
          SET_REQUIRED_CONTEXT: {
            target: "deviceInitialization",
            actions: assign({
              requiredDeviceContext: ({ event }) => event.context,
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
          SET_REQUIRED_CONTEXT: {
            target: "deviceInitialization",
            actions: assign({
              requiredDeviceContext: ({ event }) => event.context,
              deviceExtractedContext: () => null,
            }),
          },
          DEVICE_DISCONNECTED: {
            target: "connectionError",
            actions: "resetConnection",
          },
        },
      },
      invalidOperation: {
        type: "final",
        entry: ({ context }) => {
          log(LOG_TYPE, "state: invalidOperation — THIS IS A BUG", {
            error: context.error,
          });
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
  initializationError(error: unknown): void;
  deviceDisconnected(): void;
  retry(): void;
  setIntent(intent: Intent<JobState, Input, ExtraProps>): void;
  setRequiredContext(context: RequiredDeviceContext): void;
  stopIntent(): void;
  stop(): void;
}

export type StateMachineConstructor<JobState, Input, ExtraProps> = new (params: {
  deviceConnectionParams: DeviceConnectionParams;
  requiredDeviceContext: RequiredDeviceContext;
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
    requiredDeviceContext: RequiredDeviceContext;
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
    this.actor.send({ type: "DEVICE_CONTEXT_INITIALIZED", context });
  }

  initializationError(error: unknown): void {
    log(LOG_TYPE, "event: initializationError", { error });
    this.actor.send({ type: "INITIALIZATION_ERROR", error });
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

  setRequiredContext(context: RequiredDeviceContext): void {
    log(LOG_TYPE, "event: setRequiredContext", context);
    this.actor.send({ type: "SET_REQUIRED_CONTEXT", context });
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
