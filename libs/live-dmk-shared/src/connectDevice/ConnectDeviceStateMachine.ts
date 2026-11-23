import type { Unsubscribable } from "rxjs";
import { type AnyEventObject, assign, createActor, fromCallback, fromPromise, setup } from "xstate";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  ConnectDeviceStateMachineEventTypes,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceAddNewDeviceOrigin,
  type ConnectDeviceStateMachineContext,
  type ConnectDeviceStateMachineEvent,
  type ConnectDeviceStateMachineInput,
  type KnownDevice,
  type MatchedDevice,
} from "./types";
import { DEFAULT_DEVICE_NOT_FOUND_DELAY } from "../connectKnownOrNewDevice/constants";
import { DefaultConnectNewDeviceStateMachine } from "../connectNewDevice/ConnectNewDeviceStateMachine";
import {
  ConnectNewDeviceUIStateTypes,
  type ConnectNewDeviceStateMachineInput,
  type ConnectNewDeviceUIState,
  type EmbeddedConnectNewDeviceUIState,
} from "../connectNewDevice/types";
import {
  getSelectedMatchedDeviceFromDiscoveryEvent,
  getMatchedDevicesFromDiscoveryEvent,
  getFirstMatchedDeviceFromDiscoveryEvent,
  buildDisplayedDevices,
} from "./utils";
import {
  type BaseConnectionError,
  type BaseDiscoveryError,
  BaseDiscoveryErrorTypes,
  type DeviceDiscoveryService,
  type UnknownDiscoveryError,
} from "../deviceConnectivity/types";
import { disconnectOtherSessions } from "../deviceConnectivity/disconnectOtherSessions";

const WAITING_FOR_SELECTED_DEVICE_TIMEOUT = 30000;

type ConnectDeviceStateMachineDiscoveryError<TDiscoveryError extends BaseDiscoveryError> =
  | TDiscoveryError
  | UnknownDiscoveryError;

type EmbeddedMachineInput<
  TDiscoveryError extends BaseDiscoveryError,
  TConnectionError extends BaseConnectionError,
> = Omit<
  ConnectNewDeviceStateMachineInput<
    ConnectDeviceStateMachineDiscoveryError<TDiscoveryError>,
    TConnectionError
  >,
  "observer" | "onConnected" | "onClose" | "embedded"
>;

const isEmbeddedUIState = <
  TDiscoveryError extends BaseDiscoveryError,
  TConnectionError extends BaseConnectionError,
>(
  uiState: ConnectNewDeviceUIState<TDiscoveryError, TConnectionError>,
): uiState is EmbeddedConnectNewDeviceUIState<TDiscoveryError, TConnectionError> =>
  uiState.type !== ConnectNewDeviceUIStateTypes.Done &&
  uiState.type !== ConnectNewDeviceUIStateTypes.Terminated &&
  uiState.type !== ConnectNewDeviceUIStateTypes.UnknownError;

const buildAddNewDevice = (
  canAddNewDevice: boolean,
  send: (event: { type: ConnectDeviceStateMachineEventTypes.UserTapsAddNewDevice }) => void,
): (() => void) | null =>
  canAddNewDevice
    ? () => send({ type: ConnectDeviceStateMachineEventTypes.UserTapsAddNewDevice })
    : null;

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
        ConnectDeviceStateMachineDiscoveryError<TDiscoveryError>,
        TConnectionError
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
          signal,
        }: {
          input: {
            dmk: DeviceManagementKit;
            matchedDevice: MatchedDevice;
          };
          signal: AbortSignal;
        }): Promise<string> => {
          disconnectOtherSessions(input.dmk, input.matchedDevice.discoveredDevice);
          const sessionId = await input.dmk.connect({
            device: input.matchedDevice.discoveredDevice,
            sessionRefresherOptions: { isRefresherDisabled: true },
          });
          if (signal.aborted) {
            await input.dmk.disconnect({ sessionId }).catch(() => undefined);
            throw new Error("Connect aborted");
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
      connectNewDevice: fromCallback<
        AnyEventObject,
        EmbeddedMachineInput<TDiscoveryError, TConnectionError>
      >(({ input, sendBack }) => {
        const embeddedMachine = new DefaultConnectNewDeviceStateMachine<
          TDiscoveryError,
          TConnectionError
        >({
          ...input,
          embedded: true,
          observer: {
            next: uiState => {
              if (isEmbeddedUIState(uiState)) {
                sendBack({
                  type: ConnectDeviceStateMachineEventTypes.ConnectNewDeviceUIStateChanged,
                  uiState,
                });
              }
            },
            error: error =>
              sendBack({ type: ConnectDeviceStateMachineEventTypes.ConnectNewDeviceFailed, error }),
            complete: () => undefined,
          },
          onConnected: result =>
            sendBack({ type: ConnectDeviceStateMachineEventTypes.NewDeviceConnected, result }),
          onClose: () => undefined,
        });
        embeddedMachine.start();
        return () => embeddedMachine.stop();
      }),
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
      canAddNewDevice: ({ context }) => context.connectNewDevice !== null,
      cameFrom: ({ context }, params: { origin: ConnectDeviceAddNewDeviceOrigin }) =>
        context.addNewDeviceOrigin === params.origin,
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
      showDeviceNotFound: assign({
        showDeviceNotFound: () => true,
      }),
      hideDeviceNotFound: assign({
        showDeviceNotFound: () => false,
      }),
      assignAddNewDeviceOrigin: assign({
        addNewDeviceOrigin: (_, params: { origin: ConnectDeviceAddNewDeviceOrigin }) =>
          params.origin,
      }),
      assignConnectNewDeviceUIState: assign({
        connectNewDeviceUIState: (
          _,
          params: {
            uiState: EmbeddedConnectNewDeviceUIState<
              ConnectDeviceStateMachineDiscoveryError<TDiscoveryError>,
              TConnectionError
            >;
          },
        ) => params.uiState,
      }),
      clearConnectNewDeviceUIState: assign({
        connectNewDeviceUIState: () => null,
      }),
      failWithConnectNewDeviceError: (_, params: { error: unknown }) => {
        throw params.error;
      },
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
      emitNoKnownDevice: ({ context, self }) => {
        context.observer.next({
          type: ConnectDeviceUIStateTypes.NoKnownDevice,
          addNewDevice: buildAddNewDevice(context.connectNewDevice !== null, self.send),
        });
      },
      emitDiscovering: ({ context, self }) => {
        context.observer.next({
          type: ConnectDeviceUIStateTypes.Discovering,
          devices: buildDisplayedDevices(context.knownDevices, context.matchedDevices, self.send),
          addNewDevice: buildAddNewDevice(context.connectNewDevice !== null, self.send),
        });
      },
      emitWaitingForSelectedDevice: ({ context, self }) => {
        context.observer.next({
          type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
          device: context.selectedKnownDevice!,
          showDeviceNotFound: context.showDeviceNotFound,
          addNewDevice: buildAddNewDevice(context.connectNewDevice !== null, self.send),
        });
      },
      emitConnectNewDevice: ({ context, self }) => {
        context.observer.next({
          type: ConnectDeviceUIStateTypes.ConnectNewDevice,
          connectNewDeviceUIState: context.connectNewDeviceUIState!,
          back: () => self.send({ type: ConnectDeviceStateMachineEventTypes.UserTapsBack }),
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
          compatDeviceId: context.buildCompatDeviceId?.(connectedDevice) ?? connectedDevice.id,
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
      discoveryError: null,
      connectionError: null,
      showDeviceNotFound: false,
      addNewDeviceOrigin: null,
      connectNewDeviceUIState: null,
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
        on: {
          [ConnectDeviceStateMachineEventTypes.UserTapsAddNewDevice]: {
            guard: "canAddNewDevice",
            target: "ConnectNewDevice",
            actions: { type: "assignAddNewDeviceOrigin", params: { origin: "NoKnownDevice" } },
          },
        },
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
          [ConnectDeviceStateMachineEventTypes.UserTapsAddNewDevice]: {
            guard: "canAddNewDevice",
            target: "ConnectNewDevice",
            actions: { type: "assignAddNewDeviceOrigin", params: { origin: "Discovering" } },
          },
        },
      },
      WaitingForSelectedDevice: {
        entry: ["hideDeviceNotFound", "startDiscovery", "emitWaitingForSelectedDevice"],
        after: {
          [DEFAULT_DEVICE_NOT_FOUND_DELAY]: {
            guard: "canAddNewDevice",
            actions: ["showDeviceNotFound", "emitWaitingForSelectedDevice"],
          },
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
          [ConnectDeviceStateMachineEventTypes.UserTapsAddNewDevice]: {
            guard: "canAddNewDevice",
            target: "ConnectNewDevice",
            actions: {
              type: "assignAddNewDeviceOrigin",
              params: { origin: "WaitingForSelectedDevice" },
            },
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
            getDiscoveredDeviceKey: context.connectNewDevice!.getDiscoveredDeviceKey,
            filterListedDevices: context.connectNewDevice!.filterListedDevices,
            ...(context.acceptedDeviceModelIds
              ? { acceptedDeviceModelIds: context.acceptedDeviceModelIds }
              : {}),
            ...(context.buildCompatDeviceId
              ? { buildCompatDeviceId: context.buildCompatDeviceId }
              : {}),
          }),
        },
        exit: "clearConnectNewDeviceUIState",
        on: {
          [ConnectDeviceStateMachineEventTypes.ConnectNewDeviceUIStateChanged]: {
            actions: [
              {
                type: "assignConnectNewDeviceUIState",
                params: ({ event }) => ({ uiState: event.uiState }),
              },
              "emitConnectNewDevice",
            ],
          },
          [ConnectDeviceStateMachineEventTypes.NewDeviceConnected]: {
            target: "Connected",
            actions: {
              type: "assignSessionId",
              params: ({ event }) => ({ sessionId: event.result.sessionId }),
            },
          },
          [ConnectDeviceStateMachineEventTypes.ConnectNewDeviceFailed]: {
            actions: {
              type: "failWithConnectNewDeviceError",
              params: ({ event }) => ({ error: event.error }),
            },
          },
          [ConnectDeviceStateMachineEventTypes.UserTapsBack]: [
            {
              guard: { type: "cameFrom", params: { origin: "NoKnownDevice" } },
              target: "NoKnownDevice",
              // The embedded machine leaves discovery running when it stops.
              actions: "stopDiscovery",
            },
            {
              guard: { type: "cameFrom", params: { origin: "WaitingForSelectedDevice" } },
              target: "WaitingForSelectedDevice",
            },
            { target: "Discovering" },
          ],
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

  private readonly observer: ConnectDeviceStateMachineInput<
    ConnectDeviceStateMachineDiscoveryError<TDiscoveryError>,
    TConnectionError
  >["observer"];

  private subscriptions: Array<Unsubscribable> = [];

  constructor(
    input: ConnectDeviceStateMachineInput<
      ConnectDeviceStateMachineDiscoveryError<TDiscoveryError>,
      TConnectionError
    >,
  ) {
    this.observer = input.observer;
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
    // Without an error observer, XState rethrows the error outside the use case.
    const actorErrorsSubscription = this.actor.subscribe({
      error: error => this.observer.error(error),
    });
    this.subscriptions.push(
      discoveredDevicesSubscription,
      errorsSubscription,
      actorErrorsSubscription,
    );
    this.actor.start();
  }

  stop(): void {
    if (this.deviceDiscoveryService.isRunning) {
      this.deviceDiscoveryService.stop();
    }
    this.actor.stop();
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions = [];
  }
}
