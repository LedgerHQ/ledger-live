import { Subscription } from "rxjs";
import { assign, createActor, fromPromise, setup } from "xstate";
import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { log } from "@ledgerhq/logs";
import { DEFAULT_DEVICE_NOT_FOUND_DELAY, DEFAULT_SUCCESS_DELAY } from "./constants";
import {
  ConnectNewDeviceStateMachineEventTypes,
  ConnectNewDeviceUIStateTypes,
  type ConnectNewDeviceStateMachineContext,
  type ConnectNewDeviceStateMachineEvent,
  type ConnectNewDeviceStateMachineInput,
} from "./types";
import { buildSelectableDevices, getScanningTransports, toDevice } from "./utils";
import {
  type BaseConnectionError,
  type BaseDiscoveryError,
  BaseDiscoveryErrorTypes,
  type DeviceDiscoveryService,
  type UnknownDiscoveryError,
} from "../deviceConnectivity/types";

type ConnectNewDeviceStateMachineDiscoveryError<TDiscoveryError extends BaseDiscoveryError> =
  | TDiscoveryError
  | UnknownDiscoveryError;

const LOG_TYPE = "ConnectNewDeviceStateMachine";

const disconnectUnclaimedSession = (dmk: DeviceManagementKit, sessionId: string): void => {
  dmk.disconnect({ sessionId }).catch(error => {
    log(LOG_TYPE, "failed to disconnect a session that was never handed to onConnected", {
      error,
    });
  });
};

const createConnectNewDeviceStateMachine = <
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
>() =>
  setup({
    types: {
      context: {} as ConnectNewDeviceStateMachineContext<
        ConnectNewDeviceStateMachineDiscoveryError<TDiscoveryError>,
        TConnectionError
      >,
      events: {} as ConnectNewDeviceStateMachineEvent<
        ConnectNewDeviceStateMachineDiscoveryError<TDiscoveryError>
      >,
      input: {} as ConnectNewDeviceStateMachineInput<
        ConnectNewDeviceStateMachineDiscoveryError<TDiscoveryError>,
        TConnectionError
      >,
    },
    actors: {
      connectDevice: fromPromise(
        async ({
          input,
          signal,
        }: {
          input: {
            dmk: DeviceManagementKit;
            discoveredDevice: DiscoveredDevice;
          };
          signal: AbortSignal;
        }): Promise<string> => {
          const sessionId = await input.dmk.connect({
            device: input.discoveredDevice,
            sessionRefresherOptions: { isRefresherDisabled: true },
          });
          const machineStoppedWhileConnecting = signal.aborted;
          if (machineStoppedWhileConnecting) {
            disconnectUnclaimedSession(input.dmk, sessionId);
          }
          return sessionId;
        },
      ),
      retryDiscovery: fromPromise<true | BaseDiscoveryError, BaseDiscoveryError>(
        async ({ input }) => {
          if (input.resolution?.type === "none") {
            return true;
          }
          return await input.resolution!.retry();
        },
      ),
    },
    delays: {
      deviceNotFoundDelay: ({ context }) => context.deviceNotFoundDelay,
      successDelay: ({ context }) => context.successDelay,
    },
    guards: {
      retryOutputIsTrue: (_, params: { output: true | BaseDiscoveryError }) =>
        params.output === true,
    },
    actions: {
      assignDiscoveredDevices: assign({
        discoveredDevices: (_, params: { devices: Array<DiscoveredDevice> }) => params.devices,
      }),
      clearDiscoveredDevices: assign({
        discoveredDevices: () => [],
      }),
      assignSelectedDevice: assign({
        selectedDevice: (_, params: { discoveredDevice: DiscoveredDevice }) =>
          params.discoveredDevice,
      }),
      clearSelectedDevice: assign({
        selectedDevice: () => null,
      }),
      assignDiscoveryError: assign({
        discoveryError: (
          _,
          params: { error: ConnectNewDeviceStateMachineDiscoveryError<TDiscoveryError> },
        ) => params.error,
      }),
      assignDiscoveryRetryError: assign({
        discoveryError: (_, params: { output: true | BaseDiscoveryError }) =>
          params.output === true
            ? null
            : (params.output as ConnectNewDeviceStateMachineDiscoveryError<TDiscoveryError>),
      }),
      clearDiscoveryError: assign({
        discoveryError: () => null,
      }),
      assignConnectionError: assign({
        connectionError: ({ context }, params: { error: unknown }) =>
          context.mapConnectionError(params.error),
      }),
      clearConnectionError: assign({
        connectionError: () => null,
      }),
      assignSessionId: assign({
        sessionId: (_, params: { sessionId: string }) => params.sessionId,
      }),
      showDeviceNotFound: assign({
        showDeviceNotFound: () => true,
      }),
      hideDeviceNotFound: assign({
        showDeviceNotFound: () => false,
      }),
      ignoreDiscoveryError: assign({
        skipTransportIds: ({ context }) => {
          const transportId = context.discoveryError!.transportId;
          if (!transportId || context.skipTransportIds.includes(transportId)) {
            return context.skipTransportIds;
          }
          return [...context.skipTransportIds, transportId];
        },
      }),
      startDiscovery: assign({
        isDiscovering: ({ context }) => {
          if (!context.isDiscovering) {
            context.deviceDiscoveryService.start({
              ignoreTransportIdentifiers: context.skipTransportIds,
            });
          }

          return true;
        },
      }),
      stopDiscovery: assign({
        isDiscovering: ({ context }) => {
          if (context.isDiscovering) {
            context.deviceDiscoveryService.stop();
          }

          return false;
        },
      }),
      emitDiscovering: ({ context, self }) => {
        context.observer.next({
          type: ConnectNewDeviceUIStateTypes.Discovering,
          devices: buildSelectableDevices(context.discoveredDevices, self.send),
          scanningTransports: getScanningTransports(
            context.deviceDiscoveryService.transportIds,
            context.skipTransportIds,
          ),
          showDeviceNotFound: context.showDeviceNotFound,
        });
      },
      emitDiscoveryError: ({ context, self }) => {
        context.observer.next({
          type: ConnectNewDeviceUIStateTypes.DiscoveryError,
          error: context.discoveryError!,
          ignore: () =>
            self.send({ type: ConnectNewDeviceStateMachineEventTypes.UserTapsDiscoveryIgnore }),
          close: () =>
            self.send({ type: ConnectNewDeviceStateMachineEventTypes.UserClosesDiscoveryError }),
          ...(context.discoveryError!.resolution !== undefined &&
          context.discoveryError!.resolution.type !== "none"
            ? {
                retry: () =>
                  self.send({
                    type: ConnectNewDeviceStateMachineEventTypes.UserTapsDiscoveryRetry,
                  }),
              }
            : {}),
        });
      },
      emitConnecting: ({ context }) => {
        context.observer.next({
          type: ConnectNewDeviceUIStateTypes.Connecting,
          device: toDevice(context.selectedDevice!),
        });
      },
      emitConnectionError: ({ context, self }) => {
        context.observer.next({
          type: ConnectNewDeviceUIStateTypes.ConnectionError,
          error: context.connectionError!,
          device: toDevice(context.selectedDevice!),
          retry: () =>
            self.send({ type: ConnectNewDeviceStateMachineEventTypes.UserTapsConnectionRetry }),
          ignore: () =>
            self.send({ type: ConnectNewDeviceStateMachineEventTypes.UserTapsConnectionIgnore }),
          close: () =>
            self.send({ type: ConnectNewDeviceStateMachineEventTypes.UserClosesConnectionError }),
        });
      },
      emitConnected: ({ context }) => {
        context.observer.next({ type: ConnectNewDeviceUIStateTypes.Connected });
      },
      emitDone: ({ context }) => {
        context.observer.next({ type: ConnectNewDeviceUIStateTypes.Done });
      },
      emitTerminated: ({ context }) => {
        context.observer.next({ type: ConnectNewDeviceUIStateTypes.Terminated });
      },
      onClose: ({ context }) => {
        context.onClose();
      },
      onConnected: ({ context }) => {
        const connectedDevice = context.dmk.getConnectedDevice({ sessionId: context.sessionId! });
        context.onConnected({
          sessionId: context.sessionId!,
          connectedDevice,
          dmk: context.dmk,
          compatDeviceId: context.buildCompatDeviceId?.(connectedDevice) ?? connectedDevice.id,
          compatDeviceName: connectedDevice.name,
          compatDeviceWired: connectedDevice.type === "USB",
        });
      },
    },
  }).createMachine({
    id: "ConnectNewDeviceStateMachine",
    initial: "Discovering",
    context: ({ input }) => ({
      ...input,
      deviceNotFoundDelay: input.deviceNotFoundDelay ?? DEFAULT_DEVICE_NOT_FOUND_DELAY,
      successDelay: input.successDelay ?? DEFAULT_SUCCESS_DELAY,
      discoveredDevices: [],
      selectedDevice: null,
      sessionId: null,
      isDiscovering: false,
      showDeviceNotFound: false,
      discoveryError: null,
      connectionError: null,
      skipTransportIds: [],
    }),
    states: {
      Discovering: {
        entry: [
          "clearDiscoveryError",
          "clearConnectionError",
          "clearSelectedDevice",
          "clearDiscoveredDevices",
          "hideDeviceNotFound",
          "startDiscovery",
          "emitDiscovering",
        ],
        after: {
          deviceNotFoundDelay: {
            actions: ["showDeviceNotFound", "emitDiscovering"],
          },
        },
        on: {
          [ConnectNewDeviceStateMachineEventTypes.DevicesDiscovered]: {
            actions: [
              {
                type: "assignDiscoveredDevices",
                params: ({ event }) => ({ devices: event.devices }),
              },
              "emitDiscovering",
            ],
          },
          [ConnectNewDeviceStateMachineEventTypes.DiscoveryError]: {
            target: "DiscoveryError",
            actions: {
              type: "assignDiscoveryError",
              params: ({ event }) => ({ error: event.error }),
            },
          },
          [ConnectNewDeviceStateMachineEventTypes.UserTapsDevice]: {
            target: "Connecting",
            actions: {
              type: "assignSelectedDevice",
              params: ({ event }) => ({ discoveredDevice: event.discoveredDevice }),
            },
          },
        },
      },
      DiscoveryError: {
        entry: ["stopDiscovery", "emitDiscoveryError"],
        on: {
          [ConnectNewDeviceStateMachineEventTypes.UserTapsDiscoveryIgnore]: {
            target: "Discovering",
            actions: "ignoreDiscoveryError",
          },
          [ConnectNewDeviceStateMachineEventTypes.UserTapsDiscoveryRetry]: {
            target: "RetryDiscovery",
          },
          [ConnectNewDeviceStateMachineEventTypes.UserClosesDiscoveryError]: {
            target: "Terminated",
          },
        },
      },
      RetryDiscovery: {
        on: {
          [ConnectNewDeviceStateMachineEventTypes.UserTapsDiscoveryIgnore]: {
            target: "Discovering",
            actions: "ignoreDiscoveryError",
          },
          [ConnectNewDeviceStateMachineEventTypes.UserClosesDiscoveryError]: {
            target: "Terminated",
          },
        },
        invoke: {
          src: "retryDiscovery",
          input: ({ context }) => context.discoveryError!,
          onDone: [
            {
              guard: {
                type: "retryOutputIsTrue",
                params: ({ event }) => ({ output: event.output }),
              },
              target: "Discovering",
            },
            {
              target: "DiscoveryError",
              actions: {
                type: "assignDiscoveryRetryError",
                params: ({ event }) => ({ output: event.output }),
              },
            },
          ],
          onError: {
            target: "DiscoveryError",
            actions: {
              type: "assignDiscoveryRetryError",
              params: ({ event }) => ({
                output: { type: BaseDiscoveryErrorTypes.Unknown, error: event.error },
              }),
            },
          },
        },
      },
      Connecting: {
        entry: ["stopDiscovery", "emitConnecting"],
        invoke: {
          src: "connectDevice",
          input: ({ context }) => ({
            dmk: context.dmk,
            discoveredDevice: context.selectedDevice!,
          }),
          onDone: {
            target: "Connected",
            actions: {
              type: "assignSessionId",
              params: ({ event }) => ({ sessionId: event.output }),
            },
          },
          onError: {
            target: "ConnectionError",
            actions: {
              type: "assignConnectionError",
              params: ({ event }) => ({ error: event.error }),
            },
          },
        },
      },
      ConnectionError: {
        entry: "emitConnectionError",
        on: {
          [ConnectNewDeviceStateMachineEventTypes.UserTapsConnectionRetry]: {
            target: "Connecting",
          },
          [ConnectNewDeviceStateMachineEventTypes.UserTapsConnectionIgnore]: {
            target: "Discovering",
          },
          [ConnectNewDeviceStateMachineEventTypes.UserClosesConnectionError]: {
            target: "Discovering",
          },
        },
      },
      Connected: {
        entry: "emitConnected",
        after: {
          successDelay: {
            target: "Done",
          },
        },
      },
      Done: {
        type: "final",
        entry: ["emitDone", "onConnected"],
      },
      Terminated: {
        type: "final",
        entry: ["emitTerminated", "onClose"],
      },
    },
  });

export interface ConnectNewDeviceStateMachine {
  start(): void;
  stop(): void;
}

export class DefaultConnectNewDeviceStateMachine<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> implements ConnectNewDeviceStateMachine {
  private readonly actor;

  private readonly dmk: DeviceManagementKit;

  private readonly deviceDiscoveryService: DeviceDiscoveryService<
    ConnectNewDeviceStateMachineDiscoveryError<TDiscoveryError>
  >;

  private subscriptions: Array<Subscription> = [];

  constructor(
    input: ConnectNewDeviceStateMachineInput<
      ConnectNewDeviceStateMachineDiscoveryError<TDiscoveryError>,
      TConnectionError
    >,
  ) {
    this.dmk = input.dmk;
    this.deviceDiscoveryService = input.deviceDiscoveryService;
    this.actor = createActor(
      createConnectNewDeviceStateMachine<TDiscoveryError, TConnectionError>(),
      { input },
    );
  }

  start(): void {
    const discoveredDevicesSubscription = this.deviceDiscoveryService.discoveredDevices.subscribe(
      devices => {
        this.actor.send({
          type: ConnectNewDeviceStateMachineEventTypes.DevicesDiscovered,
          devices,
        });
      },
    );
    const errorsSubscription = this.deviceDiscoveryService.errors.subscribe(error => {
      this.actor.send({ type: ConnectNewDeviceStateMachineEventTypes.DiscoveryError, error });
    });
    this.actor.start();
    this.subscriptions.push(discoveredDevicesSubscription, errorsSubscription);
  }

  stop(): void {
    const snapshot = this.actor.getSnapshot();

    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions = [];
    if (snapshot.context.isDiscovering) {
      this.deviceDiscoveryService.stop();
    }
    this.actor.stop();

    const { sessionId } = snapshot.context;
    const stoppedDuringSuccessDelay = snapshot.matches("Connected");
    if (stoppedDuringSuccessDelay && sessionId !== null) {
      disconnectUnclaimedSession(this.dmk, sessionId);
    }
  }
}
