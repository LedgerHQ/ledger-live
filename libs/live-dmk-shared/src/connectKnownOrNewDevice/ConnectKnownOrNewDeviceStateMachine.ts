import type {
  ConnectedDevice,
  DeviceManagementKit,
  DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { log } from "@ledgerhq/logs";
import type { Unsubscribable } from "rxjs";
import {
  assign,
  createActor,
  enqueueActions,
  fromCallback,
  fromPromise,
  setup,
  type AnyEventObject,
} from "xstate";

import { buildDeviceList } from "./buildDeviceList";
import { DEFAULT_DEVICE_NOT_FOUND_DELAY } from "./constants";
import {
  ConnectKnownOrNewDeviceStateMachineEventTypes as EventTypes,
  ConnectKnownOrNewDeviceUIStateTypes,
  DeviceListItemStatuses,
  type ConnectKnownOrNewDeviceStateMachineContext,
  type ConnectKnownOrNewDeviceStateMachineEvent,
  type ConnectKnownOrNewDeviceStateMachineInput,
  type DeviceListEntry,
  type DeviceListItem,
  type DeviceListItemStatus,
  type SelectableDeviceListItem,
} from "./types";
import { DefaultConnectNewDeviceStateMachine } from "../connectNewDevice/ConnectNewDeviceStateMachine";
import {
  ConnectNewDeviceUIStateTypes,
  type ConnectNewDeviceStateMachineInput,
  type ConnectNewDeviceUIState,
  type EmbeddedConnectNewDeviceUIState,
} from "../connectNewDevice/types";
import {
  BaseDiscoveryErrorTypes,
  type BaseConnectionError,
  type BaseDiscoveryError,
  type DeviceConnectionResult,
  type DeviceDiscoveryService,
  type UnknownDiscoveryError,
} from "../deviceConnectivity/types";

type MachineDiscoveryError<TDiscoveryError extends BaseDiscoveryError> =
  | TDiscoveryError
  | UnknownDiscoveryError;

type MachineInput<
  TDiscoveryError extends BaseDiscoveryError,
  TConnectionError extends BaseConnectionError,
> = Omit<
  ConnectKnownOrNewDeviceStateMachineInput<
    MachineDiscoveryError<TDiscoveryError>,
    TConnectionError
  >,
  "knownDevices$" | "connectedDevices$"
>;

type EmbeddedMachineInput<
  TDiscoveryError extends BaseDiscoveryError,
  TConnectionError extends BaseConnectionError,
> = Omit<
  ConnectNewDeviceStateMachineInput<MachineDiscoveryError<TDiscoveryError>, TConnectionError>,
  "observer" | "onConnected" | "onClose" | "ownsDiscoveryService"
>;

const LOG_TYPE = "ConnectKnownOrNewDeviceStateMachine";

const stopRunningDiscovery = (deviceDiscoveryService: DeviceDiscoveryService): void => {
  if (deviceDiscoveryService.isRunning) {
    deviceDiscoveryService.stop();
  }
};

const disconnectSession = (dmk: DeviceManagementKit, sessionId: string): Promise<void> =>
  dmk.disconnect({ sessionId }).catch(error => {
    log(LOG_TYPE, "failed to disconnect a device", { error });
  });

const buildConnectionResult = (
  dmk: DeviceManagementKit,
  connectedDevice: ConnectedDevice,
  buildCompatDeviceId?: (device: ConnectedDevice) => string,
): DeviceConnectionResult => ({
  sessionId: connectedDevice.sessionId,
  connectedDevice,
  dmk,
  compatDeviceId: buildCompatDeviceId?.(connectedDevice) ?? connectedDevice.id,
  compatDeviceName: connectedDevice.name,
  compatDeviceWired: connectedDevice.type === "USB",
});

const isEmbeddedUIState = <
  TDiscoveryError extends BaseDiscoveryError,
  TConnectionError extends BaseConnectionError,
>(
  uiState: ConnectNewDeviceUIState<TDiscoveryError, TConnectionError>,
): uiState is EmbeddedConnectNewDeviceUIState<TDiscoveryError, TConnectionError> =>
  uiState.type !== ConnectNewDeviceUIStateTypes.Done &&
  uiState.type !== ConnectNewDeviceUIStateTypes.Terminated &&
  uiState.type !== ConnectNewDeviceUIStateTypes.UnknownError;

const toDeviceListItem = ({
  key,
  device,
  connectivity,
  status,
}: DeviceListEntry): DeviceListItem => ({
  key,
  device,
  connectivity,
  status,
});

const toSelectableDeviceListItem = (
  entry: DeviceListEntry,
  send: (event: Extract<ConnectKnownOrNewDeviceStateMachineEvent, { key: string }>) => void,
): SelectableDeviceListItem => {
  const { key } = entry;
  const connect = () => send({ type: EventTypes.UserTapsDevice, key });
  const isRemovable = entry.knownDevice !== null && entry.connectivity === "BLE";
  const removeAction = isRemovable
    ? { remove: () => send({ type: EventTypes.UserTapsRemoveDevice, key }) }
    : {};

  if (entry.status === DeviceListItemStatuses.Connected) {
    return {
      ...toDeviceListItem(entry),
      status: entry.status,
      connect,
      disconnect: () => send({ type: EventTypes.UserTapsDisconnectDevice, key }),
      ...removeAction,
    };
  }
  return { ...toDeviceListItem(entry), status: entry.status, connect, ...removeAction };
};

const findEntry = (
  deviceList: Array<DeviceListEntry>,
  key: string | undefined,
): DeviceListEntry | undefined => deviceList.find(entry => entry.key === key);

const createConnectKnownOrNewDeviceStateMachine = <
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
>() =>
  setup({
    types: {
      context: {} as ConnectKnownOrNewDeviceStateMachineContext<
        MachineDiscoveryError<TDiscoveryError>,
        TConnectionError
      >,
      events: {} as ConnectKnownOrNewDeviceStateMachineEvent<
        MachineDiscoveryError<TDiscoveryError>,
        TConnectionError
      >,
      input: {} as MachineInput<TDiscoveryError, TConnectionError>,
    },
    actors: {
      connectDevice: fromPromise(
        async ({
          input,
        }: {
          input: {
            dmk: DeviceManagementKit;
            discoveredDevice: DiscoveredDevice;
            sessionIdsToDisconnect: Array<string>;
          };
        }): Promise<string> => {
          await Promise.all(
            input.sessionIdsToDisconnect.map(sessionId => disconnectSession(input.dmk, sessionId)),
          );
          return await input.dmk.connect({
            device: input.discoveredDevice,
            sessionRefresherOptions: { isRefresherDisabled: true },
          });
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
      connectNewDevice: fromCallback<
        AnyEventObject,
        EmbeddedMachineInput<TDiscoveryError, TConnectionError>
      >(({ input, sendBack }) => {
        const embeddedMachine = new DefaultConnectNewDeviceStateMachine<
          TDiscoveryError,
          TConnectionError
        >({
          ...input,
          ownsDiscoveryService: false,
          observer: {
            next: uiState => {
              if (isEmbeddedUIState(uiState)) {
                sendBack({ type: EventTypes.ConnectNewDeviceUIStateChanged, uiState });
              }
            },
            error: error => sendBack({ type: EventTypes.ConnectNewDeviceFailed, error }),
            complete: () => undefined,
          },
          onConnected: result => sendBack({ type: EventTypes.NewDeviceConnected, result }),
          onClose: () => undefined,
        });
        embeddedMachine.start();
        return () => embeddedMachine.stop();
      }),
    },
    delays: {
      deviceNotFoundDelay: ({ context }) => context.deviceNotFoundDelay,
    },
    guards: {
      tappedDeviceHasStatus: ({ context }, params: { key: string; status: DeviceListItemStatus }) =>
        findEntry(context.deviceList, params.key)?.status === params.status,
      selectedDeviceIsAvailable: ({ context }) =>
        findEntry(context.deviceList, context.selectedEntry?.key)?.status ===
        DeviceListItemStatuses.Available,
      connectNewDeviceIsDiscovering: ({ context }) =>
        context.connectNewDeviceUIState?.type === ConnectNewDeviceUIStateTypes.Discovering,
      retryOutputIsTrue: (_, params: { output: true | BaseDiscoveryError }) =>
        params.output === true,
    },
    actions: {
      updateDeviceList: assign(({ context, event }) => {
        const knownDevices =
          event.type === EventTypes.KnownDevicesChanged ? event.knownDevices : context.knownDevices;
        const connectedDevices =
          event.type === EventTypes.ConnectedDevicesChanged
            ? event.connectedDevices
            : context.connectedDevices;
        const discoveredDevices =
          event.type === EventTypes.DevicesDiscovered
            ? event.discoveredDevices
            : context.discoveredDevices;
        return {
          knownDevices,
          connectedDevices,
          discoveredDevices,
          deviceList: buildDeviceList({
            knownDevices,
            connectedDevices,
            discoveredDevices,
            findMatchingDevice: context.findMatchingDevice,
            getConnectivity: context.getConnectivity,
            getDiscoveredDeviceKey: context.getDiscoveredDeviceKey,
          }),
        };
      }),
      assignSelectedEntry: assign({
        selectedEntry: ({ context }, params: { key: string }) =>
          findEntry(context.deviceList, params.key) ?? null,
      }),
      assignSelectedEntryFromDeviceList: assign({
        selectedEntry: ({ context }) => findEntry(context.deviceList, context.selectedEntry?.key)!,
      }),
      clearSelectedEntry: assign({ selectedEntry: () => null }),
      showDeviceNotFound: assign({ showDeviceNotFound: () => true }),
      hideDeviceNotFound: assign({ showDeviceNotFound: () => false }),
      assignDiscoveryError: assign({
        discoveryError: (_, params: { error: MachineDiscoveryError<TDiscoveryError> }) =>
          params.error,
      }),
      assignDiscoveryRetryError: assign({
        discoveryError: (_, params: { output: true | BaseDiscoveryError }) =>
          params.output === true ? null : (params.output as MachineDiscoveryError<TDiscoveryError>),
      }),
      clearDiscoveryError: assign({ discoveryError: () => null }),
      assignConnectionError: assign({
        connectionError: ({ context }, params: { error: unknown }) =>
          context.mapConnectionError(params.error),
      }),
      clearConnectionError: assign({ connectionError: () => null }),
      assignConnectNewDeviceUIState: assign({
        connectNewDeviceUIState: (
          _,
          params: {
            uiState: EmbeddedConnectNewDeviceUIState<
              MachineDiscoveryError<TDiscoveryError>,
              TConnectionError
            >;
          },
        ) => params.uiState,
      }),
      clearConnectNewDeviceUIState: assign({ connectNewDeviceUIState: () => null }),
      ignoreDiscoveryError: assign({
        transportIdsToIgnore: ({ context }) => {
          const transportId = context.discoveryError?.transportId;
          return !transportId || context.transportIdsToIgnore.includes(transportId)
            ? context.transportIdsToIgnore
            : [...context.transportIdsToIgnore, transportId];
        },
      }),
      startDiscovery: enqueueActions(({ context, enqueue }) => {
        const { deviceDiscoveryService, isPaused, transportIdsToIgnore } = context;
        if (isPaused || deviceDiscoveryService.isRunning) {
          return;
        }
        enqueue(() =>
          deviceDiscoveryService.start({
            ignoreTransportIdentifiers: [
              ...new Set([...deviceDiscoveryService.ignoredTransportIds, ...transportIdsToIgnore]),
            ],
          }),
        );
        enqueue.assign({ transportIdsToIgnore: [] });
      }),
      stopDiscovery: ({ context }) => stopRunningDiscovery(context.deviceDiscoveryService),
      pauseDiscovery: enqueueActions(({ context, enqueue }) => {
        enqueue.assign({ isPaused: true });
        enqueue(() => stopRunningDiscovery(context.deviceDiscoveryService));
      }),
      markResumed: assign({ isPaused: () => false }),
      disconnectDevice: ({ context }, params: { key: string }) => {
        const connectedDevice = findEntry(context.deviceList, params.key)?.connectedDevice;
        if (connectedDevice) {
          void disconnectSession(context.dmk, connectedDevice.sessionId);
        }
      },
      removeDevice: ({ context }, params: { key: string }) => {
        const entry = findEntry(context.deviceList, params.key);
        if (!entry?.knownDevice || entry.connectivity !== "BLE") {
          return;
        }
        const { knownDevice, connectedDevice } = entry;
        if (!connectedDevice) {
          context.removeKnownDevice(knownDevice);
          return;
        }
        void disconnectSession(context.dmk, connectedDevice.sessionId).then(() =>
          context.removeKnownDevice(knownDevice),
        );
      },
      onConnectedWithExistingSession: ({ context }, params: { key: string }) => {
        const { connectedDevice, knownDevice } = findEntry(context.deviceList, params.key)!;
        context.onConnected(
          buildConnectionResult(context.dmk, connectedDevice!, context.buildCompatDeviceId),
          { isNewDevice: knownDevice === null },
        );
      },
      onConnectedWithNewSession: ({ context }, params: { sessionId: string }) => {
        const connectedDevice = context.dmk.getConnectedDevice({ sessionId: params.sessionId });
        context.onConnected(
          buildConnectionResult(context.dmk, connectedDevice, context.buildCompatDeviceId),
          { isNewDevice: context.selectedEntry?.knownDevice === null },
        );
      },
      onNewDeviceConnected: ({ context }, params: { result: DeviceConnectionResult }) => {
        context.onConnected(params.result, { isNewDevice: true });
      },
      failWithConnectNewDeviceError: (_, params: { error: unknown }) => {
        throw params.error;
      },
      emitDiscovering: ({ context, self }) => {
        context.observer.next({
          type: ConnectKnownOrNewDeviceUIStateTypes.Discovering,
          devices: context.deviceList.map(entry => toSelectableDeviceListItem(entry, self.send)),
          addNewDevice: () => self.send({ type: EventTypes.UserTapsAddNewDevice }),
        });
      },
      emitWaitingForDevice: ({ context, self }) => {
        context.observer.next({
          type: ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice,
          devices: context.deviceList.map(toDeviceListItem),
          device: context.selectedEntry!.device,
          showDeviceNotFound: context.showDeviceNotFound,
          addNewDevice: () => self.send({ type: EventTypes.UserTapsAddNewDevice }),
          close: () => self.send({ type: EventTypes.UserClosesWaitingForDevice }),
        });
      },
      emitConnecting: ({ context, self }) => {
        context.observer.next({
          type: ConnectKnownOrNewDeviceUIStateTypes.Connecting,
          devices: context.deviceList.map(toDeviceListItem),
          device: context.selectedEntry!.device,
          close: () => self.send({ type: EventTypes.UserClosesConnecting }),
        });
      },
      emitConnectNewDevice: ({ context, self }) => {
        context.observer.next({
          type: ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice,
          connectNewDeviceUIState: context.connectNewDeviceUIState!,
          close: () => self.send({ type: EventTypes.UserClosesConnectNewDevice }),
        });
      },
      emitDiscoveryError: ({ context, self }) => {
        const { resolution } = context.discoveryError!;
        const hasRetry = resolution !== undefined && resolution.type !== "none";
        context.observer.next({
          type: ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError,
          devices: context.deviceList.map(toDeviceListItem),
          error: context.discoveryError!,
          ignore: () => self.send({ type: EventTypes.UserTapsDiscoveryIgnore }),
          close: () => self.send({ type: EventTypes.UserClosesDiscoveryError }),
          ...(hasRetry
            ? { retry: () => self.send({ type: EventTypes.UserTapsDiscoveryRetry }) }
            : {}),
        });
      },
      emitConnectionError: ({ context, self }) => {
        context.observer.next({
          type: ConnectKnownOrNewDeviceUIStateTypes.ConnectionError,
          devices: context.deviceList.map(toDeviceListItem),
          error: context.connectionError!,
          device: context.selectedEntry!.device,
          retry: () => self.send({ type: EventTypes.UserTapsConnectionRetry }),
          ignore: () => self.send({ type: EventTypes.UserTapsConnectionIgnore }),
          close: () => self.send({ type: EventTypes.UserClosesConnectionError }),
        });
      },
    },
  }).createMachine({
    id: "ConnectKnownOrNewDeviceStateMachine",
    initial: "Discovering",
    context: ({ input }) => {
      const { delays, isPaused, ...rest } = input;
      return {
        ...rest,
        deviceNotFoundDelay: delays?.deviceNotFoundDelay ?? DEFAULT_DEVICE_NOT_FOUND_DELAY,
        connectNewDeviceDelays: delays?.connectNewDevice,
        isPaused: isPaused ?? false,
        knownDevices: [],
        connectedDevices: [],
        discoveredDevices: [],
        deviceList: [],
        selectedEntry: null,
        showDeviceNotFound: false,
        transportIdsToIgnore: [],
        discoveryError: null,
        connectionError: null,
        connectNewDeviceUIState: null,
      };
    },
    on: {
      [EventTypes.Pause]: { actions: "pauseDiscovery" },
      [EventTypes.Resume]: { actions: "markResumed" },
    },
    states: {
      Discovering: {
        entry: [
          "clearSelectedEntry",
          "clearDiscoveryError",
          "clearConnectionError",
          "startDiscovery",
          "emitDiscovering",
        ],
        on: {
          [EventTypes.KnownDevicesChanged]: { actions: ["updateDeviceList", "emitDiscovering"] },
          [EventTypes.ConnectedDevicesChanged]: {
            actions: ["updateDeviceList", "emitDiscovering"],
          },
          [EventTypes.DevicesDiscovered]: { actions: ["updateDeviceList", "emitDiscovering"] },
          [EventTypes.DiscoveryError]: {
            target: "DiscoveryError",
            actions: {
              type: "assignDiscoveryError",
              params: ({ event }) => ({ error: event.error }),
            },
          },
          [EventTypes.UserTapsDevice]: [
            {
              guard: {
                type: "tappedDeviceHasStatus",
                params: ({ event }) => ({
                  key: event.key,
                  status: DeviceListItemStatuses.Connected,
                }),
              },
              actions: [
                "pauseDiscovery",
                {
                  type: "onConnectedWithExistingSession",
                  params: ({ event }) => ({ key: event.key }),
                },
              ],
            },
            {
              guard: {
                type: "tappedDeviceHasStatus",
                params: ({ event }) => ({
                  key: event.key,
                  status: DeviceListItemStatuses.Available,
                }),
              },
              target: "Connecting",
              actions: { type: "assignSelectedEntry", params: ({ event }) => ({ key: event.key }) },
            },
            {
              guard: {
                type: "tappedDeviceHasStatus",
                params: ({ event }) => ({
                  key: event.key,
                  status: DeviceListItemStatuses.Unavailable,
                }),
              },
              target: "WaitingForDevice",
              actions: { type: "assignSelectedEntry", params: ({ event }) => ({ key: event.key }) },
            },
          ],
          [EventTypes.UserTapsDisconnectDevice]: {
            actions: { type: "disconnectDevice", params: ({ event }) => ({ key: event.key }) },
          },
          [EventTypes.UserTapsRemoveDevice]: {
            actions: { type: "removeDevice", params: ({ event }) => ({ key: event.key }) },
          },
          [EventTypes.UserTapsAddNewDevice]: { target: "ConnectNewDevice" },
          [EventTypes.Resume]: { actions: ["markResumed", "startDiscovery"] },
        },
      },
      WaitingForDevice: {
        entry: ["hideDeviceNotFound", "startDiscovery", "emitWaitingForDevice"],
        after: {
          deviceNotFoundDelay: { actions: ["showDeviceNotFound", "emitWaitingForDevice"] },
        },
        always: {
          guard: "selectedDeviceIsAvailable",
          target: "Connecting",
          actions: "assignSelectedEntryFromDeviceList",
        },
        on: {
          [EventTypes.KnownDevicesChanged]: {
            actions: ["updateDeviceList", "emitWaitingForDevice"],
          },
          [EventTypes.ConnectedDevicesChanged]: {
            actions: ["updateDeviceList", "emitWaitingForDevice"],
          },
          [EventTypes.DevicesDiscovered]: { actions: ["updateDeviceList", "emitWaitingForDevice"] },
          [EventTypes.DiscoveryError]: {
            target: "DiscoveryError",
            actions: {
              type: "assignDiscoveryError",
              params: ({ event }) => ({ error: event.error }),
            },
          },
          [EventTypes.UserTapsAddNewDevice]: { target: "ConnectNewDevice" },
          [EventTypes.UserClosesWaitingForDevice]: { target: "Discovering" },
          [EventTypes.Resume]: { actions: ["markResumed", "startDiscovery"] },
        },
      },
      Connecting: {
        entry: ["stopDiscovery", "emitConnecting"],
        invoke: {
          src: "connectDevice",
          input: ({ context }) => ({
            dmk: context.dmk,
            discoveredDevice: context.selectedEntry!.discoveredDevice!,
            sessionIdsToDisconnect: context.connectedDevices.map(({ sessionId }) => sessionId),
          }),
          onDone: {
            target: "Discovering",
            actions: [
              "pauseDiscovery",
              {
                type: "onConnectedWithNewSession",
                params: ({ event }) => ({ sessionId: event.output }),
              },
            ],
          },
          onError: {
            target: "ConnectionError",
            actions: {
              type: "assignConnectionError",
              params: ({ event }) => ({ error: event.error }),
            },
          },
        },
        on: {
          [EventTypes.KnownDevicesChanged]: { actions: ["updateDeviceList", "emitConnecting"] },
          [EventTypes.ConnectedDevicesChanged]: { actions: ["updateDeviceList", "emitConnecting"] },
          [EventTypes.DevicesDiscovered]: { actions: ["updateDeviceList", "emitConnecting"] },
          [EventTypes.UserClosesConnecting]: { target: "Discovering" },
        },
      },
      ConnectionError: {
        entry: "emitConnectionError",
        on: {
          [EventTypes.KnownDevicesChanged]: {
            actions: ["updateDeviceList", "emitConnectionError"],
          },
          [EventTypes.ConnectedDevicesChanged]: {
            actions: ["updateDeviceList", "emitConnectionError"],
          },
          [EventTypes.DevicesDiscovered]: { actions: ["updateDeviceList", "emitConnectionError"] },
          [EventTypes.UserTapsConnectionRetry]: { target: "Connecting" },
          [EventTypes.UserTapsConnectionIgnore]: { target: "Discovering" },
          [EventTypes.UserClosesConnectionError]: { target: "Discovering" },
        },
      },
      DiscoveryError: {
        entry: ["stopDiscovery", "emitDiscoveryError"],
        on: {
          [EventTypes.KnownDevicesChanged]: { actions: ["updateDeviceList", "emitDiscoveryError"] },
          [EventTypes.ConnectedDevicesChanged]: {
            actions: ["updateDeviceList", "emitDiscoveryError"],
          },
          [EventTypes.DevicesDiscovered]: { actions: ["updateDeviceList", "emitDiscoveryError"] },
          [EventTypes.UserTapsDiscoveryRetry]: { target: "RetryDiscovery" },
          [EventTypes.UserTapsDiscoveryIgnore]: {
            target: "Discovering",
            actions: "ignoreDiscoveryError",
          },
          [EventTypes.UserClosesDiscoveryError]: {
            target: "Discovering",
            actions: "ignoreDiscoveryError",
          },
        },
      },
      RetryDiscovery: {
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
        on: {
          [EventTypes.KnownDevicesChanged]: { actions: ["updateDeviceList", "emitDiscoveryError"] },
          [EventTypes.ConnectedDevicesChanged]: {
            actions: ["updateDeviceList", "emitDiscoveryError"],
          },
          [EventTypes.DevicesDiscovered]: { actions: ["updateDeviceList", "emitDiscoveryError"] },
          [EventTypes.UserTapsDiscoveryIgnore]: {
            target: "Discovering",
            actions: "ignoreDiscoveryError",
          },
          [EventTypes.UserClosesDiscoveryError]: {
            target: "Discovering",
            actions: "ignoreDiscoveryError",
          },
        },
      },
      ConnectNewDevice: {
        invoke: {
          src: "connectNewDevice",
          input: ({ context }) => ({
            dmk: context.dmk,
            deviceDiscoveryService: context.deviceDiscoveryService,
            mapConnectionError: context.mapConnectionError,
            getDiscoveredDeviceKey: context.getDiscoveredDeviceKey,
            ...(context.filterListedDevices
              ? { filterListedDevices: context.filterListedDevices }
              : {}),
            ...(context.buildCompatDeviceId
              ? { buildCompatDeviceId: context.buildCompatDeviceId }
              : {}),
            ...context.connectNewDeviceDelays,
          }),
        },
        exit: "clearConnectNewDeviceUIState",
        on: {
          [EventTypes.KnownDevicesChanged]: { actions: "updateDeviceList" },
          [EventTypes.ConnectedDevicesChanged]: { actions: "updateDeviceList" },
          [EventTypes.DevicesDiscovered]: { actions: "updateDeviceList" },
          [EventTypes.ConnectNewDeviceUIStateChanged]: {
            actions: [
              {
                type: "assignConnectNewDeviceUIState",
                params: ({ event }) => ({ uiState: event.uiState }),
              },
              "emitConnectNewDevice",
            ],
          },
          [EventTypes.NewDeviceConnected]: {
            target: "Discovering",
            actions: [
              "pauseDiscovery",
              { type: "onNewDeviceConnected", params: ({ event }) => ({ result: event.result }) },
            ],
          },
          [EventTypes.ConnectNewDeviceFailed]: {
            actions: {
              type: "failWithConnectNewDeviceError",
              params: ({ event }) => ({ error: event.error }),
            },
          },
          [EventTypes.UserClosesConnectNewDevice]: { target: "Discovering" },
          [EventTypes.Resume]: [
            { guard: "connectNewDeviceIsDiscovering", actions: ["markResumed", "startDiscovery"] },
            { actions: "markResumed" },
          ],
        },
      },
    },
  });

export interface ConnectKnownOrNewDeviceStateMachine {
  start(): void;
  stop(): void;
  /** Stops discovery until `resume()`. */
  pause(): void;
  resume(): void;
}

export class DefaultConnectKnownOrNewDeviceStateMachine<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> implements ConnectKnownOrNewDeviceStateMachine {
  private readonly actor;

  private readonly knownDevices$: ConnectKnownOrNewDeviceStateMachineInput["knownDevices$"];

  private readonly connectedDevices$: ConnectKnownOrNewDeviceStateMachineInput["connectedDevices$"];

  private readonly deviceDiscoveryService: DeviceDiscoveryService<
    MachineDiscoveryError<TDiscoveryError>
  >;

  private readonly observer: ConnectKnownOrNewDeviceStateMachineInput<
    MachineDiscoveryError<TDiscoveryError>,
    TConnectionError
  >["observer"];

  private subscriptions: Array<Unsubscribable> = [];

  constructor(
    input: ConnectKnownOrNewDeviceStateMachineInput<
      MachineDiscoveryError<TDiscoveryError>,
      TConnectionError
    >,
  ) {
    const { knownDevices$, connectedDevices$, ...machineInput } = input;
    this.knownDevices$ = knownDevices$;
    this.connectedDevices$ = connectedDevices$;
    this.deviceDiscoveryService = input.deviceDiscoveryService;
    this.observer = input.observer;
    this.actor = createActor(
      createConnectKnownOrNewDeviceStateMachine<TDiscoveryError, TConnectionError>(),
      { input: machineInput },
    );
  }

  start(): void {
    const { deviceDiscoveryService } = this;
    const fail = (error: unknown) => this.fail(error);

    this.subscriptions.push(
      this.knownDevices$.subscribe({
        next: knownDevices =>
          this.actor.send({ type: EventTypes.KnownDevicesChanged, knownDevices }),
        error: fail,
      }),
      this.connectedDevices$.subscribe({
        next: connectedDevices =>
          this.actor.send({ type: EventTypes.ConnectedDevicesChanged, connectedDevices }),
        error: fail,
      }),
      deviceDiscoveryService.discoveredDevices.subscribe(discoveredDevices => {
        const keepsTheLastScanWhileStopped = !deviceDiscoveryService.isRunning;
        if (!keepsTheLastScanWhileStopped) {
          this.actor.send({ type: EventTypes.DevicesDiscovered, discoveredDevices });
        }
      }),
      deviceDiscoveryService.errors.subscribe(error => {
        this.actor.send({ type: EventTypes.DiscoveryError, error });
      }),
      // Without an error observer, XState rethrows the error outside the use case.
      this.actor.subscribe({ error: fail }),
    );
    this.actor.start();
  }

  stop(): void {
    const isRunning = this.actor.getSnapshot().status === "active";
    this.unsubscribe();
    this.actor.stop();
    if (isRunning) {
      stopRunningDiscovery(this.deviceDiscoveryService);
    }
  }

  pause(): void {
    this.actor.send({ type: EventTypes.Pause });
  }

  resume(): void {
    this.actor.send({ type: EventTypes.Resume });
  }

  private fail(error: unknown): void {
    this.unsubscribe();
    this.actor.stop();
    try {
      stopRunningDiscovery(this.deviceDiscoveryService);
    } catch (cleanupError) {
      log(LOG_TYPE, "failed to stop discovery after a failure", { error: cleanupError });
    }
    this.observer.error(error);
  }

  private unsubscribe(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions = [];
  }
}
