import type { Observable } from "rxjs";
import { setup, assign, fromObservable, createActor } from "xstate";
import type {
  DeviceConnectionParams,
  DeviceConnectionResult,
  DeviceExtractedContext,
  Intent,
  RequiredDeviceContext,
} from "./core";
import type { ExecutorState } from "./executor";

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
  /** @xstate-layout N4IgpgJg5mDOIC5QBEwDcCWBjMBJAdgC5hECiAHmFgK6ED2ATgHQTrZgDCd++VhG3AMTJSANVwdSAfQ4B5AHLzSHACqlkAbQAMAXUSgADnVgZ+3fSHKIAjNYAcAVibWAbHZcBmAOxeAnG60HOwAaEABPGy1rJg8PXzsAJi0PawAWa18vVIcAXxzQ1EwcAmIyShp6ZlYizm5eLDN8QTlFZRVcBSlSACVu2W7tPSQQIxNGiysEL1imBw83BzSEu2svF2tQiIQAWictf0CHNes4hIyPXPyQQvYSkkIKKlpGJiw6vgF8UgYGRkFu0gqboATUGFlGpk+E0QXgys18vlcHmSsORG3CiG28SYqWW+1iCRcqUcCTyBTYxSI90eFRe1Vu+EhAEMADYYABeTMawjEEmkLTUAA0VFJcPJcO0AIIAGVwAC11GDhhDxsNJrZUr4mD4tElTnYvAbNogXAkvExTWstMlkQ4HKkydcKXgqWUnpUWM6CMy2ZzuWKJbgZfLJe1Oj0+gNdODjJDzGqbN4nHYtH5rA4EvMtI4QhiEMiXExM3EfNYEulCQ6rjdKaUHuVnlUvYz+KyOVzPoIAMqA0XyNT9pWGWOq0DqhypmKJVK61ypFK+BzGhAzuw47zE2K2vWOmsuus0xuemre1u+jtCETiSRSZC4LstJSqRXR5UjqEJhB2DypIvpdYeEkZxZLmWxJkwKz2icUFxHMu7NgeDYehgLYYG2fqfN8vwMP8gIgkOIzvvGY6Jt4RaZLqbh2AaazLkkhaLokQSzqkLi+Lq8Enq69bui8KGIe6nYQNwYBMChaB0AA1qJe53G6tLMPx1JIZ8CDiXQWAXvggwESqH4kQgZZaL+qTTHEvjZHYiJGnmtirEWPhEjm7gJK5nEMgJClidxh7cmAPwvAYLJcgAZowAC2TCyT5SF8TFgncGp+ASZpjQ6a+w5jPplgwvaEH+JmniLgkE6+MuKyFrqZwOL4FxrJ4djubWym8Yp8UVJ2V58re96Pm0L5DJlcb4NCX4-n+rgnEBqyasuQQeEw1ouFoLjrFkDhsaS1YIS1XlKfJtCdj2IpigOKi6URI2frVWjOGx85sV4G1JGVeaJOaCLuJkmZZC4hpNfuu1HvtPEdUIx1SACACKACquAAsgMgKEK50ZYRWXETlCCLL+PhnOWZymck6JbO9TCfY9P2sf921cZ5wPtYd4MqLIAAKfZnRdGNXQZZZlkWGQZpkFkbamy7WIE0TLOkGZJKshUA3JoMMweAU4QCQKgmjemY5MqLao4m3LGarguMui4fQWc6i6sviK4zyE+Wr3a9qdpCDtrl2jV9MQIrqi7rKLoGIBb5NW0SNsrPb9PIRALJgC7J39u7qODejw2jWkfgWt+0zMdMj3ixLWorV4Zx-dk9ouNHQOx-HieQ6QsPw+oSPJ8KXMZ5+6amot1qASsrleLqHji2aWrZPExlAfOVbknTtd8XHCddTed4PgoT5qJonvc5nLhOBcyyZKkuKBIaqRj8PEGmexFxWaf+x5Fc+B0Kw8DDNFMeMDGe-d-ZR8rJZDPkcOwl88zbHsIWbIPdlonBOLPGuB0PT0hwFwHgHxMY6x5ljWwCIcQ+BSKmUsKYlwQOxIudMNUD41TiJ4JBysPRvAwQ0TCatf5d15vglMy1yxRFxJqbwy44hh1WicCyawRaNVph5ReTYuI+nbKOdOyj1QZHNDOAspoyx2nLMuSeOJ5zpmsoseIRwGG+TioojC3AsI-zfH-XmmoEgWnmBcXEFl5jxHFpkZwywFymXcCkLIFjYptRjtlbBmcMi3QtsAg0yJWLLkNC4uYW4Ui4mHoSUJrVvKq2whw1RiBglFlNLEMu6YUzljNm9Visx6ITkJD4DaHgcl7WXoU7K6ozgLQlkPWqQQnqLivrdQCp8wHUUCIBVpz8gA */
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
                context.listeners.onIntentJobStateChanged(context.currentIntent, jobState);
              }
            },
          },
          onDone: {
            target: "idle",
            actions: ({ context }) => {
              context.listeners.onIntentJobComplete(context.currentIntent);
            },
          },
          onError: {
            target: "intentError",
            actions: [
              ({ event, context }) => {
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
            target: "intentError",
            actions: [
              assign({
                currentIntent: ({ event }) => event.intent,
                error: () => new Error("Intent changed during execution"),
              }),
            ],
          },
          SET_REQUIRED_CONTEXT: {
            target: "intentError",
            actions: [
              assign({
                requiredDeviceContext: ({ event }) => event.context,
                error: () => new Error("Required context changed during execution"),
              }),
            ],
          },
          STOP_INTENT: "idle",
        },
      },
      intentError: {
        entry: ({ context }) => {
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
        },
      },
      idle: {
        entry: ({ context }) => {
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
    this.actor.send({ type: "DEVICE_CONNECTED", result });
  }

  connectionError(error: unknown): void {
    this.actor.send({ type: "CONNECTION_ERROR", error });
  }

  deviceContextInitialized(context: DeviceExtractedContext): void {
    this.actor.send({ type: "DEVICE_CONTEXT_INITIALIZED", context });
  }

  initializationError(error: unknown): void {
    this.actor.send({ type: "INITIALIZATION_ERROR", error });
  }

  deviceDisconnected(): void {
    this.actor.send({ type: "DEVICE_DISCONNECTED" });
  }

  retry(): void {
    this.actor.send({ type: "RETRY" });
  }

  // -- Caller-driven events --

  setIntent(intent: Intent<JobState, Input, ExtraProps>): void {
    this.actor.send({ type: "SET_INTENT", intent });
  }

  setRequiredContext(context: RequiredDeviceContext): void {
    this.actor.send({ type: "SET_REQUIRED_CONTEXT", context });
  }

  stopIntent(): void {
    this.actor.send({ type: "STOP_INTENT" });
  }

  // -- Cleanup --

  stop(): void {
    this.actor.stop();
  }
}
