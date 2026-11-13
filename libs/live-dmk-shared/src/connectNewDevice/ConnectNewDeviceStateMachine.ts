import type { Unsubscribable } from "rxjs";
import { assign, createActor, fromPromise, setup } from "xstate";
import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { log } from "@ledgerhq/logs";
import { DEFAULT_DEVICE_NOT_FOUND_DELAY, DEFAULT_SUCCESS_DELAY } from "./constants";
import { mergeDiscoveredDevices } from "./mergeDiscoveredDevices";
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
            disconnectsUnclaimedSession: boolean;
          };
          signal: AbortSignal;
        }): Promise<string> => {
          const sessionId = await input.dmk.connect({
            device: input.discoveredDevice,
            sessionRefresherOptions: { isRefresherDisabled: true },
          });
          const machineStoppedWhileConnecting = signal.aborted;
          if (machineStoppedWhileConnecting && input.disconnectsUnclaimedSession) {
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
      ownsDiscoveryService: ({ context }) => context.ownsDiscoveryService,
    },
    actions: {
      updateListedDevices: assign({
        listedDevices: ({ context }, params: { devices: Array<DiscoveredDevice> }) =>
          mergeDiscoveredDevices(
            context.listedDevices,
            params.devices,
            context.getDiscoveredDeviceKey,
          ),
      }),
      clearListedDevices: assign({
        listedDevices: () => [],
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
      ignoreDiscoveryError: ({ context }) => {
        const { ignoredTransportIds } = context.deviceDiscoveryService;
        const transportId = context.discoveryError!.transportId;
        context.deviceDiscoveryService.start({
          ignoreTransportIdentifiers:
            !transportId || ignoredTransportIds.includes(transportId)
              ? ignoredTransportIds
              : [...ignoredTransportIds, transportId],
        });
      },
      startDiscovery: ({ context }) => {
        if (!context.deviceDiscoveryService.isRunning) {
          context.deviceDiscoveryService.start({
            ignoreTransportIdentifiers: context.deviceDiscoveryService.ignoredTransportIds,
          });
        }
      },
      stopDiscovery: ({ context }) => {
        if (context.deviceDiscoveryService.isRunning) {
          context.deviceDiscoveryService.stop();
        }
      },
      emitDiscovering: ({ context, self }) => {
        context.observer.next({
          type: ConnectNewDeviceUIStateTypes.Discovering,
          devices: buildSelectableDevices(
            context.filterListedDevices?.(context.listedDevices) ?? context.listedDevices,
            self.send,
          ),
          scanningTransports: getScanningTransports(
            context.deviceDiscoveryService.transportIds,
            context.deviceDiscoveryService.ignoredTransportIds,
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
        context.observer.next({
          type: ConnectNewDeviceUIStateTypes.Connected,
          device: toDevice(context.selectedDevice!),
        });
      },
      emitDone: ({ context }) => {
        context.observer.next({
          type: ConnectNewDeviceUIStateTypes.Done,
          device: toDevice(context.selectedDevice!),
        });
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
      ownsDiscoveryService: input.ownsDiscoveryService ?? true,
      listedDevices: [],
      selectedDevice: null,
      sessionId: null,
      showDeviceNotFound: false,
      discoveryError: null,
      connectionError: null,
    }),
    states: {
      Discovering: {
        entry: [
          "clearDiscoveryError",
          "clearConnectionError",
          "clearSelectedDevice",
          "clearListedDevices",
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
                type: "updateListedDevices",
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
          [ConnectNewDeviceStateMachineEventTypes.UserClosesDiscoveryError]: [
            { guard: "ownsDiscoveryService", target: "Terminated" },
            { target: "Discovering", actions: "ignoreDiscoveryError" },
          ],
        },
      },
      RetryDiscovery: {
        on: {
          [ConnectNewDeviceStateMachineEventTypes.UserTapsDiscoveryIgnore]: {
            target: "Discovering",
            actions: "ignoreDiscoveryError",
          },
          [ConnectNewDeviceStateMachineEventTypes.UserClosesDiscoveryError]: [
            { guard: "ownsDiscoveryService", target: "Terminated" },
            { target: "Discovering", actions: "ignoreDiscoveryError" },
          ],
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
            disconnectsUnclaimedSession: context.ownsDiscoveryService,
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

  private readonly observer: ConnectNewDeviceStateMachineInput<
    ConnectNewDeviceStateMachineDiscoveryError<TDiscoveryError>,
    TConnectionError
  >["observer"];

  private subscriptions: Array<Unsubscribable> = [];

  constructor(
    input: ConnectNewDeviceStateMachineInput<
      ConnectNewDeviceStateMachineDiscoveryError<TDiscoveryError>,
      TConnectionError
    >,
  ) {
    this.dmk = input.dmk;
    this.observer = input.observer;
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
    // Without an error observer, XState rethrows the error outside the use case.
    const actorErrorsSubscription = this.actor.subscribe({
      error: error => {
        try {
          // A failed actor is no longer active, so stop() would skip this cleanup.
          this.releaseResources();
        } catch (cleanupError) {
          log(LOG_TYPE, "failed to release the resources of a failed state machine", {
            error: cleanupError,
          });
        }
        this.observer.error(error);
      },
    });
    this.subscriptions.push(
      discoveredDevicesSubscription,
      errorsSubscription,
      actorErrorsSubscription,
    );
    this.actor.start();
  }

  stop(): void {
    const isRunning = this.actor.getSnapshot().status === "active";

    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions = [];
    this.actor.stop();
    if (isRunning) {
      this.releaseResources();
    }
  }

  private releaseResources(): void {
    const snapshot = this.actor.getSnapshot();
    // A failure while computing the initial state leaves a snapshot without context.
    if (!snapshot.context) {
      return;
    }

    const { ownsDiscoveryService, sessionId } = snapshot.context;
    // The parent keeps scanning, and lists the unclaimed session as a connected device.
    if (!ownsDiscoveryService) {
      return;
    }

    if (this.deviceDiscoveryService.isRunning) {
      this.deviceDiscoveryService.stop();
    }

    const stoppedDuringSuccessDelay = snapshot.matches("Connected");
    if (stoppedDuringSuccessDelay && sessionId !== null) {
      disconnectUnclaimedSession(this.dmk, sessionId);
    }
  }
}
