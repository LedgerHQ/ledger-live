import type {
  DeviceActionStateMachine,
  InternalApi,
  StateMachineTypes,
} from "@ledgerhq/device-management-kit";
import {
  CommandResultStatus,
  DeviceActionStatus,
  GetAppAndVersionCommand,
  UnknownDAError,
  UserInteractionRequired,
  XStateDeviceAction,
} from "@ledgerhq/device-management-kit";
import { Left, Right } from "purify-ts";
import { assign, fromObservable, fromPromise, setup } from "xstate";
import { ConnectAppCompletionCapturer } from "./ConnectAppCompletionCapturer";
import { EnsureAppReadyStateEmitter } from "./EnsureAppReadyStateEmitter";
import { AppInteractionRequiredStateType, FinalStateType } from "./state";
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
      getAppAndVersion: async () => {
        const result = await internalApi.sendCommand(new GetAppAndVersionCommand());

        if (result.status !== CommandResultStatus.Success) {
          throw result.error;
        }

        return result.data;
      },
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
          additionalSnapshotHandlers: this.input.additionalSnapshotHandlers,
        } as types["input"],
        context: {} as types["context"],
        output: {} as types["output"],
      },
      actors: {
        connectApp: fromObservable(() => connectAppDeviceAction._execute(internalApi).observable),
        getAppAndVersion: fromPromise(async () => machineDependencies.getAppAndVersion()),
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
          _internalState: ({ context }) => ({
            ...context._internalState,
            ...(connectAppCompletionCapturer.getCompletionCapture() ?? {}),
          }),
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
        assignCurrentApp: assign({
          _internalState: ({ context, event }) => ({
            ...context._internalState,
            currentApp: event.output,
          }),
        }),
        emitHandledGetAppAndVersionError: ({ event }) => {
          this.input.observer.next(
            actionDependencies.remapGetAppAndVersionError?.(event.error) ?? {
              type: FinalStateType.Error,
              error: event.error,
            },
          );
        },
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
      /** @xstate-layout N4IgpgJg5mDOIC5QFEB2sCuAnMBBADvgEpgCGEAngCJgBuAlgMZ6MAu9A9qgHQDCXqMGwL4AxBC5hu9VLQ4BrKYwFDWIgNoAGALqJQ+DrHrsuekAA9EAZisBWbgCYAjLYBsV169sOrAdk1uADQgFIgOmgCc3JqavgAcDgAs7k6JPr4OAL6ZwWiYOCIk5NR0TCwmPPyogsKEomBYWBxY3PgANqSsAGbNALbcytWqGjpmBkYVZpYINvbObh5e6QGuwaEIcU7REX5WcW5Jsb6J2bno2HiERZQ0DMy4bJw8uF2sDVU1anVaukgg48YnlNEAkog44ok0p5wk5fE4ImtrBFNI5YglEporElbHFTiA8hdCmQbqV7o8uNwXm8sB9ht8nL99IZAaY-tMElZuF5Er5bC5fBE4hEIolEQhfK5EtFDk4HK4nJ5NA5fHiCQUrsSSndyk9Ka93ipamJ1A5Gf9mZM2SCnCjbIk9k47FYIq45b4xXFndxYfDfFjNHFuarzuriJrbmUHhVuABxMBffC4VAQABqDSMXHEkmksgUUhgCaTqfTTx+YwtQKtCBckO9vICtgF8rifrFdgc3FsfJxSoczl5TmD+UuYeKEbJ0bjheTaawGdQ9UazVaHW6fW4BZERdn87LfwBltA0xrUthtgbTacLasYtcIu4AudVntXnPWKHhI1Y9JOopVIaU5bjOJaZnuTITJWR5hLErjeskIqurYNgQm2njcBiViOsKDhIQcJw5PiIYjtcWqRuSzz6lggGENuIELuoDLlhBrJQQg4QSnBd7JDhyGiiEiDnnE3AIcicI7JhwofqGJHjr+FHUtRibAXOTyiCaZoHpBFjQRxqRcYhvFil2UreJsETKvCsSwlJxHhj+Ua6gA8hgrAQJ0kAiAA6qQWCoDIUCiLwjkAHIACoAJLBQAqsgAD6jlRaFVC4KFyBULFnm4EQwWRTGYHmsxqDAmxnhbH6EqxE6-ixKhp5IVhMSVX4NlEt+2oORSABiMikG09AAF5gGpoz7hWLHaTMV72F27gRN4V5Nm2cQop4vhwsqFlyrieKoBwEBwGYaq2W1ZGHgVLJFVWAC0qz8QgV32MKwpIRiQoiqktgtV+JLteRfCGgmTEXcVaRijs6Eui2vLPokgaSl9o4-adur-jSAMiEDZ3TO4vjRJisLKn68qw2KPi2nKjbOKksqbAjMn2X9im0Sp42aeNx6wiiHg4WkfZxPzzi1cJdr+DsrgBrKAR03Zv3RqjTPKfOmNacenr2OLmHxPENrPnEbbHNE-h2Datg7JoaTSydE5OS5blvBAXk+X5qBQMr7NhH4sF+pCribHp8RtokWwuDENbhFtViW0j1tdT1fWDW7l2sQ4ET+MJmI8Z4EI4m2bjepK4uJOec1CnaUekTHPChQ0vQ9fbifFTYMSOLKnhYkH-MSktWyJMK9q97EdrOPh2RAA */
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
              target: "GetAppAndVersion",
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
        GetAppAndVersion: {
          invoke: {
            id: "getAppAndVersion",
            src: "getAppAndVersion",
            onDone: {
              target: "AfterGetAppAndVersion",
              actions: "assignCurrentApp",
            },
            onError: {
              target: "Terminated",
              actions: "emitHandledGetAppAndVersionError",
            },
          },
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
