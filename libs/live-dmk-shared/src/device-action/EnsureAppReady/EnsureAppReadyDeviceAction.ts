import type {
  DeviceActionStateMachine,
  InternalApi,
  StateMachineTypes,
} from "@ledgerhq/device-management-kit";
import {
  DeviceActionStatus,
  UnknownDAError,
  UserInteractionRequired,
  XStateDeviceAction,
} from "@ledgerhq/device-management-kit";
import { Left, Right } from "purify-ts";
import { assign, fromObservable, setup } from "xstate";
import { ConnectAppCompletionCapturer } from "./ConnectAppCompletionCapturer";
import { EnsureAppReadyStateEmitter } from "./EnsureAppReadyStateEmitter";
import { AppInteractionRequiredStateType } from "./state";
import type {
  EnsureAppReadyDAError,
  EnsureAppReadyDAInput,
  EnsureAppReadyDAIntermediateValue,
  EnsureAppReadyDAOutput,
  EnsureAppReadyDeviceActionConstructorArgs,
  EnsureAppReadyDeviceActionDependencies,
  EnsureAppReadyInternalState,
  EnsureAppReadyMachineDependencies,
} from "./types";

export type {
  EnsureAppReadyDAError,
  EnsureAppReadyDAInput,
  EnsureAppReadyDAIntermediateValue,
  EnsureAppReadyDAOutput,
  EnsureAppReadyDeviceActionConstructorArgs,
  EnsureAppReadyDeviceActionDependencies,
  EnsureAppReadyMachineDependencies,
} from "./types";

/**
 * This device action wraps around a ConnectAppDeviceAction and emits a state that is ready
 * to be consumed by the UI.
 */
export class EnsureAppReadyDeviceAction extends XStateDeviceAction<
  EnsureAppReadyDAOutput,
  EnsureAppReadyDAInput,
  EnsureAppReadyDAError,
  EnsureAppReadyDAIntermediateValue,
  EnsureAppReadyInternalState
> {
  private readonly dependencies: EnsureAppReadyDeviceActionDependencies;

  constructor({ dependencies, ...args }: EnsureAppReadyDeviceActionConstructorArgs) {
    super(args);
    this.dependencies = dependencies;
  }

  extractDependencies(internalApi: InternalApi): EnsureAppReadyMachineDependencies {
    return {
      getCurrentDeviceState: () => internalApi.getDeviceSessionState(),
    };
  }

  makeStateMachine(
    internalApi: InternalApi,
  ): DeviceActionStateMachine<
    EnsureAppReadyDAOutput,
    EnsureAppReadyDAInput,
    EnsureAppReadyDAError,
    EnsureAppReadyDAIntermediateValue,
    EnsureAppReadyInternalState
  > {
    type types = StateMachineTypes<
      EnsureAppReadyDAOutput,
      EnsureAppReadyDAInput,
      EnsureAppReadyDAError,
      EnsureAppReadyDAIntermediateValue,
      EnsureAppReadyInternalState
    >;

    const actionDependencies = this.dependencies;
    const machineDependencies = this.extractDependencies(internalApi);
    const connectAppDeviceAction = this.input.connectAppDeviceAction;
    const additionalSnapshotHandlers = this.input.additionalSnapshotHandlers;

    const connectAppCompletionCapturer = new ConnectAppCompletionCapturer();
    const connectAppSnapshotHandlers = [
      new EnsureAppReadyStateEmitter({
        observer: this.input.observer,
        appName: this.input.appName,
        deprecation: this.input.deprecation,
        deprecationDismissedCurrencyNames: this.input.deprecationDismissedCurrencyNames,
        getCurrentDeviceState: machineDependencies.getCurrentDeviceState,
        retry: this.input.retry,
      }),
      ...additionalSnapshotHandlers,
      connectAppCompletionCapturer,
    ];

    return setup({
      types: {
        input: {
          appName: this.input.appName,
          deprecation: this.input.deprecation,
          deprecationDismissedCurrencyNames: this.input.deprecationDismissedCurrencyNames,
          connectAppDeviceAction: this.input.connectAppDeviceAction,
          observer: this.input.observer,
          retry: this.input.retry,
          additionalSnapshotHandlers: this.input.additionalSnapshotHandlers,
        } as types["input"],
        context: {} as types["context"],
        output: {} as types["output"],
      },
      actors: {
        connectApp: fromObservable(() => connectAppDeviceAction._execute(internalApi).observable),
      },
      actions: {
        assignLatestConnectAppState: assign({
          _internalState: ({ context, event }) => {
            const state = event.snapshot.context;
            if (!state) return context._internalState;
            return {
              ...context._internalState,
              latestConnectAppState: state,
            };
          },
        }),

        handleConnectAppSnapshot: ({ event }) => {
          const state = event.snapshot.context;
          if (!state) return;
          connectAppSnapshotHandlers.forEach(handler => handler.handleSnapshot(state));
        },

        assignConnectAppCompletionCapture: assign({
          _internalState: ({ context }) => {
            const completionCapture = connectAppCompletionCapturer.getCompletionCapture();

            if (!completionCapture) {
              return context._internalState;
            }

            return {
              ...context._internalState,
              deviceMetadata: completionCapture.deviceMetadata,
              derivation: completionCapture.derivation,
              currentApp: completionCapture.currentApp,
            };
          },
        }),

        assignUnexpectedError: assign({
          _internalState: ({ context, event }) => ({
            ...context._internalState,
            unexpectedError: new UnknownDAError(
              `Unexpected app initialization device action failure: ${event.error?.message ?? "Unknown error"}`,
            ),
          }),
        }),
        assignMissingConnectAppTerminalStateError: assign({
          _internalState: ({ context }) => ({
            ...context._internalState,
            unexpectedError: new UnknownDAError(
              "Missing connect-app terminal state in initialization wrapper",
            ),
          }),
        }),
        assignMissingCurrentAppError: assign({
          _internalState: ({ context }) => ({
            ...context._internalState,
            unexpectedError: new UnknownDAError(
              "Missing current app before finalizing initialization",
            ),
          }),
        }),
        emitOutdatedAppWarning: ({ context, self }) => {
          const currentAppName = context._internalState.currentApp?.name ?? context.input.appName;

          this.input.observer.next({
            type: AppInteractionRequiredStateType.OutdatedAppWarning,
            appName: currentAppName,
            onContinue: () => self.send({ type: "CONTINUE_OUTDATED_WARNING" }),
          });
        },
        emitFinalState: ({ context }) => {
          this.input.observer.next(
            actionDependencies.buildFinalState({
              deviceMetadata: context._internalState.deviceMetadata,
              currentApp: context._internalState.currentApp!,
              derivation: context._internalState.derivation,
            }),
          );
        },
      },
      guards: {
        latestConnectAppStateCompleted: ({ context }) =>
          context._internalState.latestConnectAppState?.status === DeviceActionStatus.Completed,
        latestConnectAppStateErrored: ({ context }) =>
          context._internalState.latestConnectAppState?.status === DeviceActionStatus.Error,
        hasCurrentApp: ({ context }) => !!context._internalState.currentApp,
        shouldShowOutdatedAppWarning: ({ context }) =>
          !!context._internalState.currentApp &&
          actionDependencies.shouldUpgrade(
            context._internalState.currentApp.name,
            context._internalState.currentApp.version,
          ),
      },
    }).createMachine({
      /** @xstate-layout N4IgpgJg5mDOIC5QFEB2sCuAnMBBADvgEpgCGEAngCJgBuAlgMZ6MAu9A9qgHQDCXqMGwL4AxBC5hu9VLQ4BrKYwFDWIgNoAGALqJQ+DrHrsuekAA9EAZisBWbgCYAjLYBsTgBybbDzU4Ds-q4ANCAUiA4ALFbcHh6RPpFeDg4AnLZWDgC+WaFomDgiJOTUdEwsJjz8qILChKJgWFgcWNz4ADakrABmLQC23Mo1qho6ZgZGlWaWCDb2zm6e3r4BQaHhCB5O3JqpVoHOkU4OHra7OXno2HiExZQ0DMy4bJw8uN2sjdW1avVaukgQBNjK9pogPGlHPEbIEnFZUgknOsIrZ-Nx-FZXJo0rZUlErE4LiB8tcimR7mUni8uNx3p8sN8Rn8nAD9IYQaZATMIakodF9v44QjbEiwohcbzUv4Ia4MbYRU4kkSSYVbuTSo8Kq9aR8vio6mJ1A5WUD2VMueDISd+bD4YjkQhXAluPKEZFImknC4rB5lVdVcR1Q9ys9Kjr6QBxMC-fC4VAQABqjSMXFE-3GZtBFoQiqcmm4qU0WKxiWtDgdUQ83C9DixXpsLkFkT9BRugZKwapYbpjSjMbjieTrzTLIzkyzoBmufzheLyw98XLYtmhe4rjcdlOHmlqUVLdJao7lK1NJ7WD7IgHSawKdQaeNY45qDBOaOM6LH9Li4d0Vcjn2GTyg48JWJo0T7gGdwaiG1I8AA8hgrAQF0kAiAA6qQWCoDIUCiLwcEAHIACoAJIEQAqsgAD6cHkURVC4ERyBUFRaG4EQBFkRG6aAsC5qTogTipKkf6RCJrh4rYHjrj4S4bFE9jSQ4uJRK40lwoEEFtlBnYnjwABiMikO09AAF5gGmYy8ZmnICQgym+NwBK2Ecu5iT4tgVq4DhOUEwmFhi3jSrYOS5CAqAcBAcBmCq2lBseoYTqa462RYiAALQhMumU7JoeX5QV+X+FpZJHpqiU0oyBqPvxaUIB6Dp7NwYkSQ4gpBO4ImpCVh4UuVsHhnqwzVdZKXPtmrj7LlBJ2FY7qgccXn2JEmgEh4Il+AEso9e2fUwd2urntGl7xtet41UlU4BPmmLKRp0RnHYFbyui-hSu4uaFtaO06QlA0IUhKEQOhmHYagUAXalU6CtsYn7HYynrQFFYpLEuLRIcToeiFYWxaVe1dtqhmoMZZlgJD412cB3hrt5mLif4Rw2BWU3bkceYuOuRaErj-pxWV+3akRjR9EZnwQBTL61lEBaCpNvhvUEVg-i9-jo5ojNFpk6ShVkQA */
      id: "EnsureAppReadyDeviceAction",
      initial: "ConnectApp",
      context: ({ input }) => ({
        input,
        intermediateValue: {
          requiredUserInteraction: UserInteractionRequired.None,
        },
        _internalState: {
          latestConnectAppState: null,
          deviceMetadata: undefined,
          derivation: undefined,
          currentApp: undefined,
          unexpectedError: null,
        },
      }),
      states: {
        ConnectApp: {
          invoke: {
            id: "connectApp",
            src: "connectApp",
            onSnapshot: {
              actions: ["assignLatestConnectAppState", "handleConnectAppSnapshot"],
            },
            onDone: {
              actions: "assignConnectAppCompletionCapture",
              target: "AfterConnectApp",
            },
            onError: {
              target: "Terminated",
              actions: "assignUnexpectedError",
            },
          },
        },
        AfterConnectApp: {
          always: [
            {
              guard: "latestConnectAppStateCompleted",
              target: "AfterGetAppAndVersion",
            },
            {
              guard: "latestConnectAppStateErrored",
              target: "Terminated",
            },
            {
              target: "Terminated",
              actions: "assignMissingConnectAppTerminalStateError",
            },
          ],
        },
        AfterGetAppAndVersion: {
          always: [
            {
              guard: "shouldShowOutdatedAppWarning",
              target: "OutdatedAppWarning",
            },
            {
              guard: "hasCurrentApp",
              target: "Finalize",
            },
            {
              target: "Terminated",
              actions: "assignMissingCurrentAppError",
            },
          ],
        },
        OutdatedAppWarning: {
          entry: "emitOutdatedAppWarning",
          on: {
            CONTINUE_OUTDATED_WARNING: {
              target: "Finalize",
            },
          },
        },
        Finalize: {
          entry: "emitFinalState",
          always: [
            {
              target: "Terminated",
            },
          ],
        },
        Terminated: {
          type: "final",
        },
      },
      output: ({ context }) => {
        if (context._internalState.unexpectedError) {
          return Left(context._internalState.unexpectedError);
        }

        return Right(undefined);
      },
    });
  }
}
