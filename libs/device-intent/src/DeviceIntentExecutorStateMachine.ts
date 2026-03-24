import type { Observable } from "rxjs";
import { setup, assign, fromObservable, createActor } from "xstate";
import type {
  DeviceConnectionParams,
  DeviceConnectionResult,
  DeviceExtractedContext,
  Intent,
  RequiredDeviceContext,
} from "./core.js";
import type { ExecutorState } from "./executor.js";

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
  /** @xstate-layout N4IgpgJg5mDOIC5QBEwDcCWBjMBJAdgC5hECiAHmFgK6ED2ATgHQTrZgDCd++VhG3AMTJSANVwdSAfQ4B5AHLzSHACqlkAbQAMAXUSgADnVgZ+3fSHKIAjNYAcAVibWAbHZcBmAOxeAnG60HOwAaEABPGy1rJg8PXzsAJi0PawAWa18vVIcAXxzQ1EwcAmIyShp6ZlYizm5eLDN8QTlFZRVcBSlSACVu2W7tPSQQIxNGiysEL1imBw83BzSEu2svF2tQiIQAWictf0CHNes4hIyPXPyQQvYSkkIKKlpGJiw6vgF8UgYGRkFu0gqboATUGFlGpk+E0QXgys18vlcHmSsORG3CiG28SYqWW+1iCRcqUcCTyBTYxSI90eFRe1Vu+EhAEMADYYABeTMawjEEmkLTUAA0VFJcPJcO0AIIAGVwAC11GDhhDxsNJrZUr4mD4tElTnYvAbNogXAkvExTWstMlkQ4HKkydcKXgqWUnpUWM6CMy2ZzuWKJbgZfLJe1Oj0+gNdODjJDzGqbN4nHYtH5rA4EvMtI4QhiEMiXExM3EfNYEulCQ6rjdKaUHuVnlUvYz+KyOVzPoIAMqA0XyNT9pWGWOq0DqhypmKJVK61ypFK+BzGhAzuw47zE2K2vWOmsuus0xuemre1u+jtCETiSRSZC4LstJSqRXR5UjqEJhB2DypIvpdYeEkZxZLmWxJkwKz2icUFxHMu7NgeDYehgLYYG2fqfN8vwMP8gIgkOIzvvGY6Jt4RaZLqbh2AaazLkkhaLokQSzqkLi+Lq8Enq69bui8KGIe6nYQNwYBMChaB0AA1qJe53G6tLMPx1JIZ8CDiXQWAXvggwESqH4kQgZZaL+qTTHEvjZHYiJGnmtirEWPhEjm7gJK5nEMgJClidxh7cmAPwvAYLJcgAZowAC2TCyT5SF8TFgncGp+ASZpjQ6a+w5jPplgwvaEH+Bk37HD4XjLisha6mcDi+BcayeHY7m1spvGKfFFSdlefK3vej5tC+QyZXG+DQl+P5-q4JxAasmrLkEHhMNaLhaC46xZA4bGktWCHNV5SnybQnY9iKYoDioulEcNn6+Jm66ufMywWfES55isv4ZmcsTxKtySNfuO1HntPHtUIR1SACACKACquAAsgMgKEKZ0ZYRWXETlCCLL+KSmamiRZPE6JbK9syuas632HYpleL9clAwDbUHSDKiyAACn2p3najl0GWWZZFhkGaZBZ62psu1iBNEyzpO9UReJmLg0wzyE+QFOEAkCoLI3paOTKi2qOBtyxmq4LjLou5o1ctc4i6sviK559MHqr3a9idpCDlrF0je4Wrmbqi7rCLoGIObTCW+sRI2ys9v-chEAsmALvHf27tIwNKNDSNaR+BaRUXCm0xsaVtni1qy1y64a32grW1cQ7ccJ0nYOkFDMPqPDKfCpzmefumpoLdagErK5Xi6h4Ytmlq2TxMZQHzlW5J17HfHx4nnU3neD4KE+aiaJ7XNZy4TgXA9WS4oEhqpBPo8QaZ7H5xZM5246+B0Kw8DDNF9eMDGB+9-ZJ8rJnySEcSmy5tj2ELNkdMctFyLH8DHfaHp6Q4C4DwD4aNtbc3RrYBEOIfApFTKWFMz0thYjXIudM1Uj7VTiJ4RBdMPRvHQQ0TCqtf49x5nglMS1yxRFxJqbwy44hh3mABCyaxhYNVrh5ZeTYuI+nbKODOyj1QZHNDOAspoyx2nLMuaeOJ5zpmsvAxw1MZFNSQXFRRGFuBYR-m+P+PNNQJAtPMC4uILLzHiGLTIzhlgLlMu4FIWQGG+TivXbKWCs4ZC0GHI4Z8DTIlYsuQ0ri5hbmxmaSiYTYqtSdthDhqjEAhKLKaWIFdmLllNi9ViJNloTkJD4daHhcktTEqvIp2V1QfWcJVPw+cvDVVITYbJMRyzEmJCQwCrS8g5CAA */
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
