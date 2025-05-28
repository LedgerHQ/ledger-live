import { Left, Right } from "purify-ts";
import { assign, setup, fromPromise } from "xstate";

import type {
  InternalApi,
  GetDeviceMetadataDAOutput,
  StateMachineTypes,
  DeviceActionStateMachine,
  InstallOrUpdateAppsDAOutput,
} from "@ledgerhq/device-management-kit";
import {
  UserInteractionRequired,
  GetDeviceMetadataDeviceAction,
  InstallOrUpdateAppsDeviceAction,
  OpenAppWithDependenciesDeviceAction,
  XStateDeviceAction,
} from "@ledgerhq/device-management-kit";

import type {
  ConnectAppDerivation,
  ConnectAppDAOutput,
  ConnectAppDAInput,
  ConnectAppDAError,
  ConnectAppDAIntermediateValue,
} from "./types";

type ConnectAppMachineInternalState = {
  readonly error: ConnectAppDAError | null;
  readonly deviceMetadata: GetDeviceMetadataDAOutput | null;
  readonly installResult: InstallOrUpdateAppsDAOutput | null;
  readonly derivation: ConnectAppDerivation | null;
};

export class ConnectAppDeviceAction extends XStateDeviceAction<
  ConnectAppDAOutput,
  ConnectAppDAInput,
  ConnectAppDAError,
  ConnectAppDAIntermediateValue,
  ConnectAppMachineInternalState
> {
  makeStateMachine(
    internalApi: InternalApi,
  ): DeviceActionStateMachine<
    ConnectAppDAOutput,
    ConnectAppDAInput,
    ConnectAppDAError,
    ConnectAppDAIntermediateValue,
    ConnectAppMachineInternalState
  > {
    type types = StateMachineTypes<
      ConnectAppDAOutput,
      ConnectAppDAInput,
      ConnectAppDAError,
      ConnectAppDAIntermediateValue,
      ConnectAppMachineInternalState
    >;

    const unlockTimeout = this.input.unlockTimeout ?? 0;

    const getMetadataMachine = new GetDeviceMetadataDeviceAction({
      input: {
        unlockTimeout,
        useSecureChannel: true,
        forceUpdate: false,
      },
    }).makeStateMachine(internalApi);

    const openAppMachine = new OpenAppWithDependenciesDeviceAction({
      input: {
        unlockTimeout,
        application: this.input.application,
        dependencies: this.input.dependencies,
        requireLatestFirmware: this.input.requireLatestFirmware,
      },
    }).makeStateMachine(internalApi);

    const installAppsMachine = new InstallOrUpdateAppsDeviceAction({
      input: {
        unlockTimeout,
        applications: this.input.dependencies,
        allowMissingApplication: this.input.allowMissingApplication,
      },
    }).makeStateMachine(internalApi);

    return setup({
      types: {
        input: {
          unlockTimeout,
        } as types["input"],
        context: {} as types["context"],
        output: {} as types["output"],
      },
      actors: {
        getMetadata: getMetadataMachine,
        openApp: openAppMachine,
        installApps: installAppsMachine,
        getDerivation: fromPromise(async () => {
          if (!this.input.requiredDerivation) {
            // Should not be possible
            throw new Error("No derivation should be needed");
          }
          return await this.input.requiredDerivation();
        }),
      },
      guards: {
        fromDashboard: ({ context }) => context.input.application.name === "BOLOS",
        requiresDerivation: ({ context }) => context.input.requiredDerivation !== undefined,
        hasError: ({ context }) => context._internalState.error !== null,
      },
      actions: {
        assignErrorFromEvent: assign({
          _internalState: _ => ({
            ..._.context._internalState,
            error: _.event["error"], // NOTE: it should never happen, the error is not typed anymore here
          }),
        }),
      },
    }).createMachine({
      id: "ConnectAppDeviceAction",
      initial: "DeviceReady",
      context: _ => {
        return {
          input: {
            application: _.input.application,
            dependencies: _.input.dependencies,
            requireLatestFirmware: _.input.requireLatestFirmware,
            unlockTimeout: _.input.unlockTimeout,
            allowMissingApplication: _.input.allowMissingApplication,
            requiredDerivation: _.input.requiredDerivation,
          },
          intermediateValue: {
            requiredUserInteraction: UserInteractionRequired.None,
            installPlan: null,
          },
          _internalState: {
            error: null,
            deviceMetadata: null,
            installResult: null,
            derivation: null,
          },
        };
      },
      states: {
        DeviceReady: {
          always: [
            {
              target: "GetDeviceMetadata",
            },
          ],
        },
        GetDeviceMetadata: {
          exit: assign({
            intermediateValue: _ => ({
              ..._.context.intermediateValue,
              requiredUserInteraction: UserInteractionRequired.None,
            }),
          }),
          invoke: {
            id: "getMetadata",
            src: "getMetadata",
            input: _ => ({
              unlockTimeout: _.context.input.unlockTimeout,
              useSecureChannel: true,
              forceUpdate: false,
            }),
            onSnapshot: {
              actions: assign({
                intermediateValue: _ => ({
                  ..._.context.intermediateValue,
                  requiredUserInteraction:
                    _.event.snapshot.context.intermediateValue.requiredUserInteraction,
                }),
              }),
            },
            onDone: {
              target: "GetDeviceMetadataCheck",
              actions: assign({
                _internalState: _ =>
                  _.event.output.caseOf<ConnectAppMachineInternalState>({
                    Right: data => ({
                      ..._.context._internalState,
                      deviceMetadata: data,
                    }),
                    Left: error => ({
                      ..._.context._internalState,
                      error,
                    }),
                  }),
              }),
            },
            onError: {
              target: "Error",
              actions: "assignErrorFromEvent",
            },
          },
        },
        GetDeviceMetadataCheck: {
          always: [
            {
              target: "Error",
              guard: "hasError",
            },
            {
              guard: "fromDashboard",
              target: "InstallDependencies",
            },
            {
              target: "OpenApp",
            },
          ],
        },
        InstallDependencies: {
          exit: assign({
            intermediateValue: _ => ({
              ..._.context.intermediateValue,
              requiredUserInteraction: UserInteractionRequired.None,
            }),
          }),
          invoke: {
            src: "installApps",
            input: _ => ({
              unlockTimeout: _.context.input.unlockTimeout,
              applications: _.context.input.dependencies,
              allowMissingApplication: _.context.input.allowMissingApplication,
            }),
            onSnapshot: {
              actions: assign({
                intermediateValue: _ => ({
                  ..._.context.intermediateValue,
                  requiredUserInteraction:
                    _.event.snapshot.context.intermediateValue.requiredUserInteraction,
                  installPlan: _.event.snapshot.context.intermediateValue.installPlan,
                }),
              }),
            },
            onDone: {
              target: "InstallDependenciesCheck",
              actions: assign({
                _internalState: _ =>
                  _.event.output.caseOf<ConnectAppMachineInternalState>({
                    Right: data => ({
                      ..._.context._internalState,
                      installResult: data,
                    }),
                    Left: error => ({
                      ..._.context._internalState,
                      error,
                    }),
                  }),
              }),
            },
            onError: {
              target: "Error",
              actions: "assignErrorFromEvent",
            },
          },
        },
        InstallDependenciesCheck: {
          always: [
            {
              guard: "hasError",
              target: "Error",
            },
            {
              target: "Success",
            },
          ],
        },
        OpenApp: {
          exit: assign({
            intermediateValue: _ => ({
              ..._.context.intermediateValue,
              requiredUserInteraction: UserInteractionRequired.None,
            }),
          }),
          invoke: {
            src: "openApp",
            input: _ => ({
              unlockTimeout: _.context.input.unlockTimeout,
              application: this.input.application,
              dependencies: this.input.dependencies,
              requireLatestFirmware: this.input.requireLatestFirmware,
            }),
            onSnapshot: {
              actions: assign({
                intermediateValue: _ => ({
                  ..._.context.intermediateValue,
                  requiredUserInteraction:
                    _.event.snapshot.context.intermediateValue.requiredUserInteraction,
                  installPlan: _.event.snapshot.context.intermediateValue.installPlan,
                }),
              }),
            },
            onDone: {
              target: "OpenAppCheck",
              actions: assign({
                _internalState: _ =>
                  _.event.output.caseOf<ConnectAppMachineInternalState>({
                    Right: data => ({
                      ..._.context._internalState,
                      installResult: data.installResult,
                    }),
                    Left: error => ({
                      ..._.context._internalState,
                      error,
                    }),
                  }),
              }),
            },
            onError: {
              target: "Error",
              actions: "assignErrorFromEvent",
            },
          },
        },
        OpenAppCheck: {
          always: [
            {
              guard: "hasError",
              target: "Error",
            },
            {
              guard: "requiresDerivation",
              target: "GetDerivation",
            },
            {
              target: "Success",
            },
          ],
        },
        GetDerivation: {
          invoke: {
            src: "getDerivation",
            onDone: {
              target: "Success",
              actions: assign({
                _internalState: _ => ({
                  ..._.context._internalState,
                  derivation: _.event.output,
                }),
              }),
            },
            onError: {
              target: "Error",
              actions: "assignErrorFromEvent",
            },
          },
        },
        Success: {
          type: "final",
        },
        Error: {
          type: "final",
        },
      },
      output: args => {
        const { context } = args;
        const { error, deviceMetadata, installResult, derivation } = context._internalState;
        if (error) {
          return Left(error);
        }
        return Right({
          deviceMetadata: deviceMetadata!,
          installResult: installResult!,
          derivation: derivation === null ? undefined : derivation,
        });
      },
    });
  }
}
