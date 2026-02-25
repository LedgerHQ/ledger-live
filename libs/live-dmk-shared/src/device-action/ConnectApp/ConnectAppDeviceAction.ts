import { Left, Right } from "purify-ts";
import { assign, setup, fromPromise, and } from "xstate";
import { gte } from "semver";

import type {
  ApplicationDependency,
  DeviceModelId,
  InternalApi,
  GetDeviceStatusDAOutput,
  GetDeviceMetadataDAOutput,
  StateMachineTypes,
  DeviceActionStateMachine,
  InstallOrUpdateAppsDAOutput,
} from "@ledgerhq/device-management-kit";
import {
  UserInteractionRequired,
  GetDeviceStatusDeviceAction,
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
  readonly deviceStatus: GetDeviceStatusDAOutput | undefined;
  readonly deviceModel: DeviceModelId | undefined;
  readonly deviceMetadata: GetDeviceMetadataDAOutput | undefined;
  readonly installResult: InstallOrUpdateAppsDAOutput | undefined;
  readonly derivation: ConnectAppDerivation | undefined;
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

    const getStatusMachine = new GetDeviceStatusDeviceAction({
      input: {
        unlockTimeout,
      },
    }).makeStateMachine(internalApi);

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
        getStatus: getStatusMachine,
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
        shouldCheckDependencies: ({ context }) =>
          context.input.dependencies.length > 0 || !!context.input.requireLatestFirmware,
        isAppOpened: ({
          context: {
            input: { application, dependencies },
            _internalState: { deviceStatus, deviceModel },
          },
        }) =>
          ConnectAppDeviceAction.isAppOpened(
            application,
            deviceStatus!,
            deviceModel!,
            dependencies,
          ),
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
            deviceStatus: undefined,
            deviceModel: undefined,
            deviceMetadata: undefined,
            installResult: undefined,
            derivation: undefined,
          },
        };
      },
      states: {
        DeviceReady: {
          entry: () => console.log("Device ready, checking status..."),
          always: [
            {
              target: "GetDeviceStatus",
            },
          ],
        },
        GetDeviceStatus: {
          entry: () => console.log("[ConnectAppDA] >>> GetDeviceStatus"),
          invoke: {
            src: "getStatus",
            input: _ => ({
              unlockTimeout: _.context.input.unlockTimeout,
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
              target: "GetDeviceStatusCheck",
              actions: assign({
                _internalState: _ => {
                  const state = internalApi.getDeviceSessionState();
                  return _.event.output.caseOf<ConnectAppMachineInternalState>({
                    Right: data => ({
                      ..._.context._internalState,
                      deviceStatus: data,
                      deviceModel: state.deviceModelId,
                    }),
                    Left: error => ({
                      ..._.context._internalState,
                      error,
                    }),
                  });
                },
              }),
            },
            onError: {
              target: "Error",
              actions: "assignErrorFromEvent",
            },
          },
        },
        GetDeviceStatusCheck: {
          entry: ({ context }) =>
            console.log(
              "[ConnectAppDA] >>> GetDeviceStatusCheck",
              JSON.stringify({
                currentApp: context._internalState.deviceStatus?.currentApp,
                currentAppVersion: context._internalState.deviceStatus?.currentAppVersion,
                deviceModel: context._internalState.deviceModel,
                hasError: context._internalState.error !== null,
              }),
            ),
          always: [
            {
              guard: "hasError",
              target: "Error",
            },
            {
              guard: and(["isAppOpened", "requiresDerivation"]),
              target: "GetDerivation",
            },
            {
              guard: "isAppOpened",
              target: "Success",
            },
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
                  deviceId:
                    _.event.snapshot.context.intermediateValue.deviceId ??
                    _.context.intermediateValue.deviceId,
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
          entry: ({ context }) =>
            console.log(
              "[ConnectAppDA] >>> InstallDependencies",
              JSON.stringify({
                dependencies: context.input.dependencies?.map(d => d.name),
              }),
            ),
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
                  deviceId:
                    _.event.snapshot.context.intermediateValue.deviceId ??
                    _.context.intermediateValue.deviceId,
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
          entry: ({ context }) =>
            console.log(
              "[ConnectAppDA] >>> InstallDependenciesCheck",
              JSON.stringify({
                hasError: context._internalState.error !== null,
              }),
            ),
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
          entry: ({ context }) =>
            console.log(
              "[ConnectAppDA] >>> OpenApp",
              JSON.stringify({
                application: context.input.application.name,
                dependencies: context.input.dependencies?.map(d => d.name),
              }),
            ),
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
                  deviceId:
                    _.event.snapshot.context.intermediateValue.deviceId ??
                    _.context.intermediateValue.deviceId,
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
          entry: ({ context }) =>
            console.log(
              "[ConnectAppDA] >>> OpenAppCheck",
              JSON.stringify({
                hasError: context._internalState.error !== null,
              }),
            ),
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
          entry: () => console.log("[ConnectAppDA] >>> GetDerivation"),
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
          entry: () => console.log("[ConnectAppDA] >>> Success"),
          type: "final",
        },
        Error: {
          entry: ({ context }) =>
            console.log("[ConnectAppDA] >>> Error", JSON.stringify(context._internalState.error)),
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
          deviceMetadata: deviceMetadata,
          installResult: installResult,
          derivation: derivation,
        });
      },
    });
  }

  static isAppOpened(
    application: ApplicationDependency,
    deviceStatus: GetDeviceStatusDAOutput,
    deviceModel: DeviceModelId,
    dependencies: ApplicationDependency[] = [],
  ) {
    const matchesConstraints = (dep: ApplicationDependency) =>
      !dep.constraints ||
      dep.constraints.every(c =>
        (!c.applicableModels || c.applicableModels.includes(deviceModel)) &&
        (!c.exemptModels || !c.exemptModels.includes(deviceModel))
          ? gte(deviceStatus.currentAppVersion, c.minVersion)
          : true,
      );

    // Direct match: the requested app is currently open
    if (deviceStatus.currentApp === application.name && matchesConstraints(application)) {
      return true;
    }

    // Plugin match: the running app is a dependency of the requested app.
    // This handles plugin apps (e.g. 1inch) that run inside their parent app (e.g. Ethereum).
    const matchingDep = dependencies.find(dep => dep.name === deviceStatus.currentApp);
    if (matchingDep && matchesConstraints(matchingDep)) {
      return true;
    }

    return false;
  }
}
