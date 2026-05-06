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

import {
  type ConnectAppDerivation,
  type ConnectAppDAOutput,
  type ConnectAppDAInput,
  type ConnectAppDAError,
  type ConnectAppDAIntermediateValue,
  type DeviceDeprecationRules,
  UserInteractionRequiredLL,
  DeviceDeprecationConfigs,
  DeviceDeprecationError,
} from "./types";
import { isDeviceDeprecated } from "./deprecation";

type ConnectAppMachineInternalState = {
  readonly error: ConnectAppDAError | null;
  readonly deviceStatus: GetDeviceStatusDAOutput | undefined;
  readonly deviceModel: DeviceModelId | undefined;
  readonly deviceMetadata: GetDeviceMetadataDAOutput | undefined;
  readonly installResult: InstallOrUpdateAppsDAOutput | undefined;
  readonly derivation: ConnectAppDerivation | undefined;
  readonly deviceDeprecation: DeviceDeprecationRules | undefined;
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
        allowMissingApplication: this.input.allowMissingApplication,
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
        isDeviceDeprecated: fromPromise(async ({ input }) => {
          const { deprecationConfig, modelId } = input as {
            deprecationConfig: DeviceDeprecationConfigs;
            modelId: DeviceModelId;
          };

          const payload = isDeviceDeprecated(deprecationConfig, modelId);

          return payload;
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
          const configs = context.input.deprecationConfig;
          const today = new Date();
          const modelId = context._internalState.deviceModel;

          if (!modelId || !configs || configs.length === 0) return false;
          if (context._internalState.deprecationShown) return false;

          const isPast = (dateStr?: string) => !!dateStr && new Date(dateStr) < today;

          return configs.some(
            config =>
              config.deviceModelId === modelId &&
              (isPast(config.errorScreen?.date) ||
                isPast(config.warningScreen?.date) ||
                isPast(config.warningClearSigningScreen?.date)),
          );
        },
      },
      actions: {
        assignErrorFromEvent: assign({
          _internalState: _ => ({
            ..._.context._internalState,
            error: _.event["error"], // NOTE: it should never happen, the error is not typed anymore here
          }),
        }),
        assignDeviceStatusFromOutput: assign({
          _internalState: _ => {
            const state = internalApi.getDeviceSessionState();
            return _.event.output.caseOf({
              Right: (data: GetDeviceStatusDAOutput) => ({
                ..._.context._internalState,
                deviceStatus: data,
                deviceModel: state.deviceModelId,
              }),
              Left: (error: ConnectAppDAError) => ({
                ..._.context._internalState,
                error,
              }),
            });
          },
        }),
      },
    }).createMachine({
      /** @xstate-layout N4IgpgJg5mDOIC5QGED2A7dYDGAXAggA6EAiYAbgJbZj56UYB0ZVNASmAIYQCeAxAG0ADAF1EoQqliVcDdOJAAPRAEYAnEMYAOAKxqAzGoBsarUJ1H9RgCwAaED1UqtjIW7f6VOgOzevO-QBfQPs0TBwCYhZqWnomAHEwXGiaAGVcTlwAV1g+CAwwRkp0clQAa0KwrDwiUgoYulkEpJSwdMychGLS7Ey5YREBhUlpJvkkJURrbyNGby1vHwAmEzUAo3tHBCWhNVchef0tLRUha30lheDQjGrIutZYscZE5Pq0jOzcsAAnH9QfoxCAAbTIAMwBAFtGFUIrVWo05C8Wu82p9Ot1UL0xgMhhMRjI5AplAhprN5otvCs1GsrJtECdXAZFlp9J4jN4hIZriBYTUoqjEUwAJKwVpkQg-HCZSDIAAWODKglEwykhIwxMQNO8rnmSwspxsSyWKnpCH0820QiMS3mXn0OiEKx5fPuCLi6EYovFYEl0twsoV2CVAhUYnxarGmoQ2t1Wn1RkN1mNpociGNS20eiOS2s5kOOi0LtucIFjyFnu9qIlUuxgcVgiW4YkkaJExJsYO8YN1uTJrN3mse30Z2cBh0Kzz1mL4X5DwaHuRb0e7S+8obeJbozboBJ+q0e0s8y5VOsRiMZzNNusjCMJxWF+sKiMhZnd3hgsXr1aq5y6+Dghhqq24au26aFoeFpmBaubnpeaYICcKiMOo1jxr4PjeGy3hvqW840BWS4-uisD-iGTbAeq4y7umnI3scbIHj2Jw6GazhnowaiDmsz5LEcfjTiEvIlnO7rPN+qK-qRQYhvozYgASUZgdshYuOebKoS++oqPobE0mpWE6bxKjnPGuGiZ+4koiuJFkYI1jyYpO6TCpB63lBJ6wY+A4vreOk6BYernN4ajmW6llIj6fp1hAeQFEUJTlJUInheWi5RbWMoQF0iXYv0oibgpragTRCAmVY2h5mYOhnomXK6QhQ46rsd4HlYXFeKFQmuh+aXPBl-qQHwvz-ICILglCMIpb1C79dWvqZQG2WYnlGC4iqEYgdRLnlbMWhVeYtWnGyZr6E+KGOkIKjzAY5zPmFM0EYuADunAyAAYgCNb+nIdBlOgqDPcCkBQJCYDoLgcVYAlpQVFNs6pbNSKvR9X0LT9GB-QDQMg2DEM5T0fRrQVG1blR0bqAYWY2Aebi6FdV5LHsOj+X4ASmLsRbddNZZI0wKO4J9Pzfat6BY4DwPQHjkMjQCQKgrgEI-NCPW809zwC0LItE2LwbY5LoPg7gBNYjr62OcV20kpT+jU2hGhCPTqZbGhmZqF4NjqByNXTEE3MI49TxIhJjwALJJNwmScFDhSYnDMC4OHGQQFHhVOSVLmeAsKHWE+KycuojtmgsmjHHo1gWG47uWA9atB80y4xEnkcZMNfxy+NiuTQnzcpxkaeW9GWc6iZeccldGhaAOyacX4GheEzI56LX+H156IdNxHfecHZA9bUPL6aFdTOXPtaiXCsxf7XMFoTpXZ3qCvYnB9Zm-J1Hu9AZt5PKVYjquCoE+xwhwXw2AhU4FcAFUjcFhDkahkxPwig3VovcP4yUbBbfev9D4AKAWfUBbELgjxCoOFYCwjhGEQX1JEwp0CwAyMCYEEpwYQHBtgSgcAY4wySvDd8ddCK0PoZwRhzD0CsPQOwuAJtRbm0okpUqud4woUsHTa0JouJsUATqLCucWau3gTMKhfNKx0IYUw30LC2EcO+O3MaCslYqx5qvARpjhHmMIJYiR1jpFmxJpgn+CjXbKJHI7NR6hvBsQ8K4S4z5Tju2tDhf2fDnGLkEWY0R4jJHSQ3KTIqWCFFcTdice8axcx2HAaPOYzJdDPhZlzG4Ad+GpNcSIixYirFwE-v4+RLkmpFOcIA0pudNEaEYLfcwiYpyLC6g05Jz8mAAHkPFi2IFwuOyVGkpOeEs8GtQfE4j8XI5yJI8w2lvAEHwFgRx5lzGxJ8tsIGDj8DpakRj1ZIh2SswgbdRrywmsrXheF5mek+XslavjBi5PTlbKYajzkOkWCom55StiAN0ChDQnJrm1N0G8tejBQXEF3lCweylFGZmfCEswNpwl3JWJxK5toVBeF8NdPFhFCWEC6UcjOJygmUtUTSjR4CqS21ZAFHSj5bTmHZYuTlu8KLfx6XypRArQlCoieAwsbsuQZi0JYIcjtZVWTeD8Sg5AdZrMSnDVWWyX6mvNTrfZ+VIXdOOVMQpnFimDInMMkVV0MVHELA6Zl-FjX2rIGai1Ywfkd3sZNW1wKiK-EdWMZ1xNXU8phQgS6bt9RnjQmYE4ag2L7RvJckyegTghTOuGpgHAwRSlgHKYiHRcj5GhuswFFlqH1rAI2uALbJIkXTegWRSr3U5v4mMiw9MC13hRaoc8exaQ7CODpTkaw62egbU2odNk22xrsf8xxmyk27sHa2r4o7x1k2VYgAI2cHR3kdPO-abEao6EYLBYwKwuRPi4tuxgF7m1Xr-OgveASXJ6C5LeaYvr7YXinuAu8zVAGFnPBhNkQGQP7piFJblE7eUPo0LbGwiwykHiQ2xLCmZsy6BmBOeMxxghCQBqw+AExE1IO2tC6MABaMBWx+NfppGJ84jtmWLCsEB1oHBuBbDvZO5MmjyTMkMN2KkFglhAY3h8NtWboyXC-SzCwHJjg7AMGaKmQ5WozCurnLRQGqyPG1ktMihnlJYT2GYK6TpaPWmMGaPimgJwvipBoPibKklAp48mg9a4ZKedKnxCq-FfC2mME+GqV4HSMACjaNmDpjTGFk-NaKWVks7QGbeXV8YdjVumKdAI+WAicxtPVTwQHNZowq2McWOMpZGyq9bZdt5Lhsn1IFY0ZohxfuHn4PihkfC6dfjQVBGQRvpmAfljQWW2TrtYghQc5JdjJjOvtA8aFVuN3W1vNBiotvmkMDeb2hhny53MFyYu59GBTLvgcCBOhnMtPcZ4rJT3kychQpdvMyxP2ROtHMF8d5rnngCjM4SZ64tpLcRkjp2TgyQ9PPlkwlwDAmHjEJpwQ5v0BGZY7XOVgdMxZ7cYglyzahPf4iZi7VL6f6jYqfTiF9czalzIsID8qktEezcmKmNKCsOxZksO5Z1xsOhqhPCuiTZmxd7evFEUadbE8MChLkL5z7JhOA1VFfhbZ6BMIYLsZwzg4f7XusDnGlPEZzc4ULOkDg3QrvGD9PhzluHOGyXVOl3cDtA8OttHnZfRgsP-dqRwziFOumxEwyFpg7FOHPA8kvWeI3eUwVIWRsA0FgN7vJUGSSWHUK4e5gCrqGlt6oCnVpgrnyZrsfUQGACitinuWE8JxNv+ozqmWLuH3sZxTliYOKxwIQA */
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
            deprecationConfig: _.input.deprecationConfig,
          },
          intermediateValue: {
            requiredUserInteraction: UserInteractionRequired.None,
            installPlan: null,
            deviceDeprecation: undefined,
            deviceMetadata: undefined,
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
              target: "GetDeviceStatus",
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
                  installPlan: null,
                }),
              }),
            },
            onDone: {
              target: "IsDeviceDeprecatedCheck",
              actions: "assignDeviceStatusFromOutput",
            },
            onError: {
              target: "Error",
              actions: "assignErrorFromEvent",
            },
          },
        },
        IsDeviceDeprecatedCheck: {
          always: [
            {
              guard: "isDeprecation",
              target: "DeviceDeprecated",
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
              guard: "shouldCheckDependencies",
              target: "GetDeviceMetadata",
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
        DeviceDeprecated: {
          invoke: {
            src: "isDeviceDeprecated",
            input: ({ context }) => ({
              deprecationConfig: context.input.deprecationConfig,
              modelId: context._internalState.deviceModel,
            }),
            onDone: {
              target: "waitForDeprecationAcknowledgment",
              actions: assign({
                intermediateValue: _ => ({
                  ..._.context.intermediateValue,
                  requiredUserInteraction: UserInteractionRequiredLL.DeviceDeprecation,
                  installPlan: null,
                  deviceDeprecation: _.event.output as DeviceDeprecationRules,
                }),
                _internalState: _ => ({
                  ..._.context._internalState,
                  deprecationShown: true,
                }),
              }),
            },
            onError: {
              target: "Error",
              actions: "assignErrorFromEvent",
            },
          },
        },
        waitForDeprecationAcknowledgment: {
          invoke: {
            src: fromPromise(async ({ input }) => {
              return new Promise<void>((resolve, reject) => {
                const payload = input.deviceDeprecation;
                if (!payload) {
                  resolve();
                  return;
                }
                payload.onContinue = (isError: boolean) => {
                  if (isError) {
                    reject(new DeviceDeprecationError());
                    return;
                  }
                  resolve();
                };
              });
            }),
            input: ({ context }) => ({
              ...context.input,
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
                  deviceId:
                    _.event.snapshot.context.intermediateValue.deviceId ??
                    _.context.intermediateValue.deviceId,
                }),
              }),
            },
            onDone: {
              target: "GetDeviceMetadataCheck",
              actions: assign({
                intermediateValue: _ =>
                  _.event.output.caseOf<ConnectAppDAIntermediateValue>({
                    Right: data => ({
                      ..._.context.intermediateValue,
                      /**
                       * Exposing the device metadata to the caller as soon as it's available,
                       * as relying on the output would not be as reliable as the ConnectAppDeviceAction can
                       * go in an error state later on, and not output the device metadata.
                       * */
                      deviceMetadata: data,
                    }),
                    Left: () => _.context.intermediateValue,
                  }),
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
          always: [
            {
              guard: "hasError",
              target: "Error",
            },
            {
              target: "RefreshDeviceStatus",
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
              allowMissingApplication: this.input.allowMissingApplication,
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
              target: "RefreshDeviceStatus",
            },
          ],
        },
        GetDerivation: {
          invoke: {
            src: "getDerivation",
            onDone: {
              target: "RefreshDeviceStatus",
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
        RefreshDeviceStatus: {
          entry: assign({
            intermediateValue: _ => ({
              ..._.context.intermediateValue,
              installPlan: null,
            }),
          }),
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
                  installPlan: null,
                }),
              }),
            },
            onDone: {
              target: "RefreshDeviceStatusCheck",
              actions: "assignDeviceStatusFromOutput",
            },
            onError: {
              target: "Error",
              actions: "assignErrorFromEvent",
            },
          },
        },
        RefreshDeviceStatusCheck: {
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
        Success: {
          type: "final",
        },
        Error: {
          type: "final",
        },
      },
      output: args => {
        const { context } = args;
        const { error, deviceMetadata, installResult, derivation, deviceStatus } =
          context._internalState;
        if (error) {
          return Left(error);
        }
        return Right({
          deviceMetadata: deviceMetadata,
          installResult: installResult,
          derivation: derivation,
          currentApp: deviceStatus
            ? {
                name: deviceStatus.currentApp,
                version: deviceStatus.currentAppVersion,
              }
            : undefined,
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
