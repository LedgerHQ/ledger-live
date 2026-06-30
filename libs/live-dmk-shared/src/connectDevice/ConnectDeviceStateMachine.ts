import { Subscription } from "rxjs";
import { assign, createActor, fromPromise, setup } from "xstate";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  BaseDiscoveryErrorTypes,
  ConnectDeviceStateMachineEventTypes,
  ConnectDeviceUIStateTypes,
  type BaseConnectionError,
  type BaseDiscoveryError,
  type ConnectDeviceStateMachineContext,
  type ConnectDeviceStateMachineEvent,
  type ConnectDeviceStateMachineInput,
  type DeviceDiscoveryService,
  type KnownDevice,
  type MatchedDevice,
  type UnknownDiscoveryError,
} from "./types";
import {
  getSelectedMatchedDeviceFromDiscoveryEvent,
  getMatchedDevicesFromDiscoveryEvent,
  getFirstMatchedDeviceFromDiscoveryEvent,
  buildDisplayedDevices,
} from "./utils";
import { dmkToLedgerDeviceIdMap } from "../config/dmkToLedgerDeviceIdMap";

const WAITING_FOR_SELECTED_DEVICE_TIMEOUT = 30000;

type ConnectDeviceStateMachineDiscoveryError<TDiscoveryError extends BaseDiscoveryError> =
  | TDiscoveryError
  | UnknownDiscoveryError;

const createConnectDeviceStateMachine = <
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
>() =>
  setup({
    types: {
      context: {} as ConnectDeviceStateMachineContext<
        ConnectDeviceStateMachineDiscoveryError<TDiscoveryError>,
        TConnectionError
      >,
      events: {} as ConnectDeviceStateMachineEvent<
        ConnectDeviceStateMachineDiscoveryError<TDiscoveryError>
      >,
      input: {} as ConnectDeviceStateMachineInput<
        ConnectDeviceStateMachineDiscoveryError<TDiscoveryError>,
        TConnectionError
      >,
    },
    actors: {
      connectDevice: fromPromise(
        async ({
          input,
        }: {
          input: {
            dmk: DeviceManagementKit;
            matchedDevice: MatchedDevice;
          };
        }): Promise<string> => {
          const sessionId = await input.dmk.connect({
            device: input.matchedDevice.discoveredDevice,
            sessionRefresherOptions: { isRefresherDisabled: true },
          });
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
    guards: {
      hasNoKnownDevice: ({ context }) => context.knownDevices.length === 0,
      hasOnlyOneKnownDevice: ({ context }) => context.knownDevices.length === 1,
      hasMoreThanOneKnownDevice: ({ context }) => context.knownDevices.length > 1,
      hasSession: ({ context }) => context.sessionId !== null,
      hasSelectedKnownDeviceMatch: ({ context, event }) =>
        getSelectedMatchedDeviceFromDiscoveryEvent(event, context.selectedKnownDevice) !== null,
      retryOutputIsTrue: (_, params: { output: true | BaseDiscoveryError }) =>
        params.output === true,
    },
    actions: {
      assignDiscoveryError: assign({
        discoveryError: ({ event }) => {
          if (event.type !== ConnectDeviceStateMachineEventTypes.DiscoveryError) {
            return null;
          }
          return event.error;
        },
      }),
      assignDiscoveryRetryError: assign({
        discoveryError: (_, params: { output: true | BaseDiscoveryError }) =>
          params.output === true
            ? null
            : (params.output as ConnectDeviceStateMachineDiscoveryError<TDiscoveryError>),
      }),
      assignMatchedDevices: assign({
        matchedDevices: ({ event }) => getMatchedDevicesFromDiscoveryEvent(event),
      }),
      assignDefaultSelectedKnownDevice: assign({
        selectedKnownDevice: ({ context }) => context.knownDevices[0] ?? null,
      }),
      assignSelectedKnownDevice: assign({
        selectedKnownDevice: ({ event }) => {
          if (event.type !== ConnectDeviceStateMachineEventTypes.UserTapsUnavailableDevice) {
            return null;
          }
          return event.knownDevice;
        },
      }),
      assignSelectedMatchedDeviceFromAvailableDevice: assign({
        selectedMatchedDevice: ({ event }) => {
          if (event.type !== ConnectDeviceStateMachineEventTypes.UserTapsAvailableDevice) {
            return null;
          }
          return event.matchedDevice;
        },
      }),
      assignSelectedMatchedDeviceFromDiscoveryEvent: assign({
        selectedMatchedDevice: ({ context, event }) =>
          getFirstMatchedDeviceFromDiscoveryEvent(event) ??
          getSelectedMatchedDeviceFromDiscoveryEvent(event, context.selectedKnownDevice),
      }),
      assignConnectionError: assign({
        connectionError: ({ context }, params: { error: unknown }) => {
          return context.mapConnectionError(params.error);
        },
      }),
      assignSessionId: assign({
        sessionId: (_, params: { sessionId: string }) => params.sessionId,
      }),
      clearConnectionError: assign({
        connectionError: () => null,
      }),
      clearDiscoveryError: assign({
        discoveryError: () => null,
      }),
      clearSelection: assign({
        selectedKnownDevice: () => null,
        selectedMatchedDevice: () => null,
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
      emitNoKnownDevice: ({ context }) => {
        context.observer.next({ type: ConnectDeviceUIStateTypes.NoKnownDevice });
      },
      emitDiscovering: ({ context, self }) => {
        context.observer.next({
          type: ConnectDeviceUIStateTypes.Discovering,
          devices: buildDisplayedDevices(context.knownDevices, context.matchedDevices, self.send),
        });
      },
      emitWaitingForSelectedDevice: ({ context, self }) => {
        context.observer.next({
          type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
          device: context.selectedKnownDevice!,
        });
      },
      emitDiscoveryError: ({ context, self }) => {
        context.observer.next({
          type: ConnectDeviceUIStateTypes.DiscoveryError,
          error: context.discoveryError!,
          ignore: () =>
            self.send({ type: ConnectDeviceStateMachineEventTypes.UserTapsDiscoveryIgnore }),
          ...(context.discoveryError!.resolution !== undefined &&
          context.discoveryError!.resolution.type !== "none"
            ? {
                retry: () =>
                  self.send({ type: ConnectDeviceStateMachineEventTypes.UserTapsDiscoveryRetry }),
              }
            : {}),
        });
      },
      emitConnecting: ({ context }) => {
        context.observer.next({
          type: ConnectDeviceUIStateTypes.Connecting,
          device: context.selectedMatchedDevice!.knownDevice,
        });
      },
      emitConnectionError: ({ context, self }) => {
        context.observer.next({
          type: ConnectDeviceUIStateTypes.ConnectionError,
          error: context.connectionError!,
          device: context.selectedMatchedDevice!.knownDevice,
          retry: () =>
            self.send({ type: ConnectDeviceStateMachineEventTypes.UserTapsConnectionRetry }),
          ignore: () =>
            self.send({ type: ConnectDeviceStateMachineEventTypes.UserTapsConnectionIgnore }),
        });
      },
      emitConnected: ({ context }) => {
        context.observer.next({ type: ConnectDeviceUIStateTypes.Connected });
      },
      onConnected: ({ context }) => {
        const connectedDevice = context.dmk.getConnectedDevice({ sessionId: context.sessionId! });
        context.onConnected({
          sessionId: context.sessionId!,
          connectedDevice,
          dmk: context.dmk,
          compatDeviceId: connectedDevice.id,
          compatDeviceModelId: dmkToLedgerDeviceIdMap[connectedDevice.modelId],
          compatDeviceName: connectedDevice.name,
          compatDeviceWired: connectedDevice.type === "USB",
        });
      },
    },
  }).createMachine({
    id: "ConnectDeviceStateMachine",
    initial: "Startup",
    context: ({ input }) => ({
      ...input,
      matchedDevices: [],
      selectedKnownDevice: null,
      selectedMatchedDevice: null,
      isDiscovering: false,
      discoveryError: null,
      connectionError: null,
      skipTransportIds: [],
    }),
    states: {
      Startup: {
        always: [
          {
            guard: "hasNoKnownDevice",
            target: "NoKnownDevice",
          },
          {
            guard: "hasSession",
            target: "Connected",
          },
          {
            guard: "hasOnlyOneKnownDevice",
            actions: ["assignDefaultSelectedKnownDevice"],
            target: "WaitingForSelectedDevice",
          },
          {
            target: "Discovering",
          },
        ],
      },
      NoKnownDevice: {
        entry: "emitNoKnownDevice",
      },
      Discovering: {
        entry: [
          "clearDiscoveryError",
          "clearConnectionError",
          "clearSelection",
          "startDiscovery",
          "emitDiscovering",
        ],
        on: {
          [ConnectDeviceStateMachineEventTypes.DiscoveredNoDevice]: {
            actions: ["assignMatchedDevices", "emitDiscovering"],
          },
          [ConnectDeviceStateMachineEventTypes.DiscoveredManyDevices]: {
            actions: ["assignMatchedDevices", "emitDiscovering"],
          },
          [ConnectDeviceStateMachineEventTypes.DiscoveredOneDevice]: {
            target: "Connecting",
            actions: ["assignMatchedDevices", "assignSelectedMatchedDeviceFromDiscoveryEvent"],
          },
          [ConnectDeviceStateMachineEventTypes.DiscoveryError]: {
            target: "DiscoveryError",
            actions: "assignDiscoveryError",
          },
          [ConnectDeviceStateMachineEventTypes.UserTapsAvailableDevice]: {
            target: "Connecting",
            actions: "assignSelectedMatchedDeviceFromAvailableDevice",
          },
          [ConnectDeviceStateMachineEventTypes.UserTapsUnavailableDevice]: {
            target: "WaitingForSelectedDevice",
            actions: "assignSelectedKnownDevice",
          },
        },
      },
      WaitingForSelectedDevice: {
        entry: ["startDiscovery", "emitWaitingForSelectedDevice"],
        after: {
          [WAITING_FOR_SELECTED_DEVICE_TIMEOUT]: {
            guard: "hasMoreThanOneKnownDevice",
            target: "Discovering",
          },
        },
        on: {
          [ConnectDeviceStateMachineEventTypes.DiscoveredNoDevice]: {
            actions: "assignMatchedDevices",
          },
          [ConnectDeviceStateMachineEventTypes.DiscoveredManyDevices]: [
            {
              guard: "hasSelectedKnownDeviceMatch",
              target: "Connecting",
              actions: ["assignMatchedDevices", "assignSelectedMatchedDeviceFromDiscoveryEvent"],
            },
            {
              actions: "assignMatchedDevices",
            },
          ],
          [ConnectDeviceStateMachineEventTypes.DiscoveredOneDevice]: [
            {
              guard: "hasSelectedKnownDeviceMatch",
              target: "Connecting",
              actions: ["assignMatchedDevices", "assignSelectedMatchedDeviceFromDiscoveryEvent"],
            },
            {
              actions: "assignMatchedDevices",
            },
          ],
          [ConnectDeviceStateMachineEventTypes.DiscoveryError]: {
            target: "DiscoveryError",
            actions: "assignDiscoveryError",
          },
        },
      },
      DiscoveryError: {
        entry: ["stopDiscovery", "emitDiscoveryError"],
        on: {
          [ConnectDeviceStateMachineEventTypes.UserTapsDiscoveryIgnore]: {
            target: "Discovering",
            actions: "ignoreDiscoveryError",
          },
          [ConnectDeviceStateMachineEventTypes.UserTapsDiscoveryRetry]: {
            target: "RetryDiscovery",
          },
        },
      },
      RetryDiscovery: {
        on: {
          [ConnectDeviceStateMachineEventTypes.UserTapsDiscoveryIgnore]: {
            target: "Discovering",
            actions: "ignoreDiscoveryError",
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
            matchedDevice: context.selectedMatchedDevice!,
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
          [ConnectDeviceStateMachineEventTypes.UserTapsConnectionRetry]: {
            target: "Connecting",
          },
          [ConnectDeviceStateMachineEventTypes.UserTapsConnectionIgnore]: {
            target: "Terminated",
          },
        },
      },
      Connected: {
        entry: ["emitConnected", "onConnected"],
      },
      Terminated: {
        type: "final",
        entry: "stopDiscovery",
      },
    },
  });

export interface ConnectDeviceStateMachine {
  start(): void;
  stop(): void;
}

export class DefaultConnectDeviceStateMachine<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> implements ConnectDeviceStateMachine {
  private readonly actor;

  private readonly deviceDiscoveryService: DeviceDiscoveryService<
    ConnectDeviceStateMachineDiscoveryError<TDiscoveryError>
  >;

  private readonly knownDevices: KnownDevice[];

  private readonly matchDiscoveredDevices: ConnectDeviceStateMachineInput<
    ConnectDeviceStateMachineDiscoveryError<TDiscoveryError>,
    TConnectionError
  >["matchDiscoveredDevices"];

  private subscriptions: Array<Subscription> = [];

  constructor(
    input: ConnectDeviceStateMachineInput<
      ConnectDeviceStateMachineDiscoveryError<TDiscoveryError>,
      TConnectionError
    >,
  ) {
    this.deviceDiscoveryService = input.deviceDiscoveryService;
    this.knownDevices = input.knownDevices;
    this.matchDiscoveredDevices = input.matchDiscoveredDevices;
    this.actor = createActor(createConnectDeviceStateMachine<TDiscoveryError, TConnectionError>(), {
      input,
    });
  }

  start(): void {
    const discoveredDevicesSubscription = this.deviceDiscoveryService.discoveredDevices.subscribe(
      devices => {
        const matchedDevices = this.matchDiscoveredDevices(devices, this.knownDevices);

        if (matchedDevices.length === 0) {
          this.actor.send({ type: ConnectDeviceStateMachineEventTypes.DiscoveredNoDevice });
        } else if (matchedDevices.length === 1) {
          this.actor.send({
            type: ConnectDeviceStateMachineEventTypes.DiscoveredOneDevice,
            matchedDevices: matchedDevices,
          });
        } else {
          this.actor.send({
            type: ConnectDeviceStateMachineEventTypes.DiscoveredManyDevices,
            matchedDevices: matchedDevices,
          });
        }
      },
    );
    const errorsSubscription = this.deviceDiscoveryService.errors.subscribe(error => {
      this.actor.send({ type: ConnectDeviceStateMachineEventTypes.DiscoveryError, error });
    });
    this.actor.start();
    this.subscriptions.push(discoveredDevicesSubscription, errorsSubscription);
  }

  stop(): void {
    const snapshot = this.actor.getSnapshot();
    if (snapshot.context.isDiscovering) {
      this.deviceDiscoveryService.stop();
    }
    this.actor.stop();
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions = [];
  }
}
