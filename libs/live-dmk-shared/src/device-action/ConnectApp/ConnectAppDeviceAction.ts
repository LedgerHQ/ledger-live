import { Left, Right } from "purify-ts";
import { assign, setup, fromPromise, and, not } from "xstate";
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

import {
  type ConnectAppDerivation,
  type ConnectAppDAOutput,
  type ConnectAppDAInput,
  type ConnectAppDAError,
  type ConnectAppDAIntermediateValue,
  type DeviceDeprecationPayload,
  UserInteractionRequiredLL,
} from "./types";
import { dmkToLedgerDeviceIdMap } from "../../config/dmkToLedgerDeviceIdMap";

type ConnectAppMachineInternalState = {
  readonly error: ConnectAppDAError | null;
  readonly deviceStatus: GetDeviceStatusDAOutput | undefined;
  readonly deviceModel: DeviceModelId | undefined;
  readonly deviceMetadata: GetDeviceMetadataDAOutput | undefined;
  readonly installResult: InstallOrUpdateAppsDAOutput | undefined;
  readonly derivation: ConnectAppDerivation | undefined;
  readonly deviceDeprecation: DeviceDeprecationPayload | undefined;
  readonly deprecationShown: boolean;
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

    function computeDeviceDeprecation(
      apconfig: any,
      modelId: DeviceModelId,
    ): DeviceDeprecationPayload {
      const now = new Date();
      const fallbackDate = now;
      const base = {
        warningScreenVisible: false,
        clearSigningScreenVisible: false,
        errorScreenVisible: false,
        modelId: dmkToLedgerDeviceIdMap[modelId], // Fallback to nanoX if not found
        date: fallbackDate,
        warningScreenConfig: { tokenExceptions: [], deprecatedFlow: [] as string[] },
        clearSigningScreenConfig: { tokenExceptions: [], deprecatedFlow: [] as string[] },
        errorScreenConfig: { tokenExceptions: [], deprecatedFlow: [] as string[] },
        onThrowError: () => {},
        onContinue: () => {},
      };
      const dd = apconfig.deviceDeprecated.find((d: any) => d.deviceModelId === modelId);
      // Date de référence: on prend d’abord error > info > clearSigning si présent
      const errorDate = dd.errorScreen?.date ? new Date(dd.errorScreen.date) : null;
      const infoDate = dd.infoScreen?.date ? new Date(dd.infoScreen.date) : null;
      const clearDate = dd.warningClearSigningScreen?.date
        ? new Date(dd.warningClearSigningScreen.date)
        : null;

      const data: DeviceDeprecationPayload = {
        ...base,
      };
      data.date = errorDate || fallbackDate;

      if (dd.errorScreen) {
        data.errorScreenConfig = {
          tokenExceptions: dd.errorScreen.tokenExceptions ?? [],
          deprecatedFlow: dd.errorScreen.deprecatedFlow ?? [],
        };
        if (errorDate && errorDate < now) {
          data.errorScreenVisible = true;
        }
      }
      if (dd.infoScreen) {
        data.warningScreenConfig = {
          tokenExceptions: dd.infoScreen.tokenExceptions ?? [],
          deprecatedFlow: dd.infoScreen.deprecatedFlow ?? [],
        };
        if (infoDate && infoDate < now) {
          data.warningScreenVisible = true;
        }
      }

      if (dd.warningClearSigningScreen) {
        data.clearSigningScreenConfig = {
          tokenExceptions: dd.warningClearSigningScreen.tokenExceptions ?? [],
          deprecatedFlow: dd.warningClearSigningScreen.deprecatedFlow ?? [],
        };
        if (clearDate && clearDate < now) {
          data.clearSigningScreenVisible = true;
        }
      }
      return data;
    }

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
            input: { application },
            _internalState: { deviceStatus, deviceModel },
          },
        }) => ConnectAppDeviceAction.isAppOpened(application, deviceStatus!, deviceModel!),
        requiresDerivation: ({ context }) => context.input.requiredDerivation !== undefined,
        hasError: ({ context }) => context._internalState.error !== null,
        isDeprecation: ({ context }) => {
          const cfg = context.input.appConfig; // <- ta config vient d'ici
          const today = new Date();
          const modelId = context._internalState.deviceModel;
          if (!cfg?.deviceDeprecated?.length) return false;
          return cfg.deviceDeprecated.some((dd: any) => {
            if (dd.deviceModelId !== modelId) return false;
            if (dd.errorScreen) {
              const errorDate = dd.errorScreen?.date ? new Date(dd.errorScreen.date) : null;
              if (errorDate && errorDate < today) return true;
            }
            if (dd.infoScreen) {
              const infoDate = dd.infoScreen?.date ? new Date(dd.infoScreen.date) : null;
              if (infoDate && infoDate < today) return true;
            }
            if (dd.warningClearSigningScreen) {
              const clearDate = dd.warningClearSigningScreen?.date
                ? new Date(dd.warningClearSigningScreen.date)
                : null;
              if (clearDate && clearDate < today) return true;
            }
            return false;
          });
        },
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
            appConfig: _.input.appConfig,
          },
          intermediateValue: {
            requiredUserInteraction: UserInteractionRequired.None,
            installPlan: null,
            deviceDeprecation: undefined,
          },
          _internalState: {
            error: null,
            deviceStatus: undefined,
            deviceModel: undefined,
            deviceMetadata: undefined,
            installResult: undefined,
            derivation: undefined,
            deviceDeprecation: undefined,
            deprecationShown: false,
          },
        };
      },
      states: {
        DeviceReady: {
          always: [
            {
              guard: "isDeprecation",
              target: "DeviceDeprecation",
            },
            {
              guard: not("shouldCheckDependencies"),
              target: "GetDeviceStatus",
            },
            {
              target: "DeprecationCheck",
            },
          ],
        },
        GetDeviceStatus: {
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
              target: "DeprecationCheck",
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
        DeprecationCheck: {
          always: [
            {
              guard: "isDeprecation",
              target: "DeviceDeprecation",
            },
            {
              guard: "hasError",
              target: "Error",
            },
            {
              target: "GetDeviceStatusCheck",
            },
          ],
        },
        GetDeviceStatusCheck: {
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
        DeviceDeprecation: {
          entry: assign(({ context }) => {
            const cfg = context.input.appConfig; // config déjà résolue pour l’app/app+dep concernée
            const modelId = context._internalState?.deviceModel;

            if (!modelId) {
              throw new Error("Device model ID is undefined");
            }
            const deviceDeprecation = computeDeviceDeprecation(cfg, modelId);
            return {
              intermediateValue: {
                ...context.intermediateValue,
                requiredUserInteraction: UserInteractionRequiredLL.DeviceDeprecation,
                installPlan: null,
                deviceDeprecation: deviceDeprecation,
              },
            };
          }),
          always: "waitForUiAnswer",
        },

        waitForUiAnswer: {
          invoke: {
            src: fromPromise(async ({ input }) => {
              return new Promise<void>((resolve, reject) => {
                const payload = input.deviceDeprecation;
                if (!payload) {
                  resolve();
                  return;
                }
                payload.onContinue = (value?: string) => {
                  if (value === "error") {
                    reject(new Error("device-deprecation"));
                    return;
                  }
                  resolve();
                };
              });
            }),
            input: ({ context }) => ({
              deviceDeprecation: context.intermediateValue.deviceDeprecation,
            }),
            onDone: {
              target: "GetDeviceStatusCheck",
            },
            onError: {
              target: "Error",
              actions: "assignErrorFromEvent",
            },
          },
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
  ) {
    return (
      deviceStatus.currentApp === application.name &&
      (!application.constraints ||
        application.constraints.every(c =>
          (!c.applicableModels || c.applicableModels.includes(deviceModel)) &&
          (!c.exemptModels || !c.exemptModels.includes(deviceModel))
            ? gte(deviceStatus.currentAppVersion, c.minVersion)
            : true,
        ))
    );
  }
}
