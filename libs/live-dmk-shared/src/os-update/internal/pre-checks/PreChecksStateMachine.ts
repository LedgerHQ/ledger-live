import {
  BatteryStatusType,
  DeviceSessionId,
  DeviceStatus,
  GetAppAndVersionCommand,
  GetBatteryStatusCommand,
  GetOsVersionCommand,
  GoToDashboardDeviceAction,
  isDashboardName,
  isSuccessCommandResult,
  UserInteractionRequired,
  WaitForAppAndVersionDeviceAction,
  type ConnectedDevice,
  type DeviceManagementKit,
  type GetOsVersionResponse,
  type GoToDashboardDAInput,
  type WaitForAppAndVersionDAInput,
} from "@ledgerhq/device-management-kit";
import type { Backup } from "@ledgerhq/dmk-ledger-wallet";
import { assign, enqueueActions, fromCallback, fromPromise, sendTo, setup } from "xstate";
import { createDeviceActionStateMachine } from "../../../device-action/CreateDeviceActionStateMachine/createDeviceActionStateMachine";
import type { DeviceBackupStorage } from "../../api/model/DeviceBackupStorage";
import { PreChecksStateType, type PreChecksState } from "../../api/model/PreChecksState";
import { OsUpdatesOrchestratorStateMachineEventType } from "../orchestrator/types";
import { isDeviceDisconnectedError } from "../utils/isDeviceDisconnectedError";
import { isDeviceLockedError } from "../utils/isDeviceLockedError";
import {
  CHARGING_MODE_NONE,
  DEVICE_MODELS_WITH_BATTERY,
  MIN_BATTERY_PERCENTAGE,
  POLL_INTERVAL_MS,
  SESSION_SETTLE_TIMEOUT_MS,
} from "./constants";
import {
  PreChecksNextAction,
  PreChecksStateMachineEventType,
  PreChecksStateMachineLastAction,
  type BatteryStatus,
  type PreChecksStateMachineContext,
  type PreChecksStateMachineEvent,
  type PreChecksStateMachineInput,
  type PreChecksStateMachineOutput,
} from "./types";
import { asBatteryPercentage } from "./utils/asBatteryPercentage";
import { asBatteryFlags } from "./utils/asBatteryFlags";
import { isSameState } from "./utils/isSameState";
import { resumeTarget } from "./utils/resumeTarget";

export const preChecksStateMachine = setup({
  types: {
    input: {} as PreChecksStateMachineInput,
    context: {} as PreChecksStateMachineContext,
    events: {} as PreChecksStateMachineEvent,
    output: {} as PreChecksStateMachineOutput,
  },
  actors: {
    waitForAppAndVersion: createDeviceActionStateMachine({
      createDeviceAction: (input: WaitForAppAndVersionDAInput) =>
        new WaitForAppAndVersionDeviceAction({ input }),
    }),
    goToDashboard: createDeviceActionStateMachine({
      createDeviceAction: (input: GoToDashboardDAInput) => new GoToDashboardDeviceAction({ input }),
    }),
    getOsVersion: fromPromise(
      async ({
        input,
      }: {
        input: { dmk: DeviceManagementKit; sessionId: DeviceSessionId };
      }): Promise<GetOsVersionResponse> => {
        const result = await input.dmk.sendCommand({
          sessionId: input.sessionId,
          command: new GetOsVersionCommand(),
        });
        if (!isSuccessCommandResult(result)) {
          throw result.error;
        }
        return result.data;
      },
    ),
    getBatteryStatus: fromPromise(
      async ({
        input,
      }: {
        input: { dmk: DeviceManagementKit; sessionId: DeviceSessionId };
      }): Promise<BatteryStatus> => {
        const percentageResult = await input.dmk.sendCommand({
          sessionId: input.sessionId,
          command: new GetBatteryStatusCommand({
            statusType: BatteryStatusType.BATTERY_PERCENTAGE,
          }),
        });
        if (!isSuccessCommandResult(percentageResult)) {
          throw percentageResult.error;
        }
        const flagsResult = await input.dmk.sendCommand({
          sessionId: input.sessionId,
          command: new GetBatteryStatusCommand({
            statusType: BatteryStatusType.BATTERY_FLAGS,
          }),
        });
        if (!isSuccessCommandResult(flagsResult)) {
          throw flagsResult.error;
        }
        return {
          percentage: asBatteryPercentage(percentageResult.data),
          isCharging: asBatteryFlags(flagsResult.data).charging !== CHARGING_MODE_NONE,
        };
      },
    ),
    getAppAndVersion: fromPromise(
      async ({
        input,
      }: {
        input: { dmk: DeviceManagementKit; sessionId: DeviceSessionId };
      }): Promise<void> => {
        const result = await input.dmk.sendCommand({
          sessionId: input.sessionId,
          command: new GetAppAndVersionCommand(),
        });
        if (!isSuccessCommandResult(result)) {
          throw result.error;
        }
      },
    ),
    getBackup: fromPromise(
      async ({
        input,
      }: {
        input: {
          storage: DeviceBackupStorage;
          deviceId: string;
        };
      }): Promise<Backup | undefined> => {
        return input.storage.getBackup(input.deviceId);
      },
    ),
    listenUntilDisconnected: fromCallback<
      PreChecksStateMachineEvent,
      { dmk: DeviceManagementKit; sessionId: DeviceSessionId }
    >(({ input, sendBack }) => {
      let subscription: { unsubscribe: () => void } | undefined;
      const notifyDisconnected = () => {
        sendBack({ type: PreChecksStateMachineEventType.DEVICE_DISCONNECTED });
        subscription?.unsubscribe();
      };
      try {
        subscription = input.dmk.getDeviceSessionState({ sessionId: input.sessionId }).subscribe({
          next: state => {
            if (state.deviceStatus !== DeviceStatus.NOT_CONNECTED) {
              return;
            }
            notifyDisconnected();
          },
          error: notifyDisconnected,
          // DMK completes the state observable when it closes the session.
          complete: notifyDisconnected,
        });
      } catch {
        // `getDeviceSessionState` throws once DMK has dropped the session.
        notifyDisconnected();
      }
      return () => {
        subscription?.unsubscribe();
      };
    }),
    // Nothing reconnects a device on its own once the transport gave up: the DMK only opens a
    // session when someone calls `connect`. So watch for the device to advertise again, then
    // connect from the device we captured, which makes the DMK reuse its session id.
    reconnectToSameDevice: fromCallback<
      PreChecksStateMachineEvent,
      { dmk: DeviceManagementKit; connectedDevice: ConnectedDevice }
    >(({ input, sendBack }) => {
      let isConnecting = false;
      const subscription = input.dmk
        .listenToAvailableDevices({ transport: input.connectedDevice.transport })
        .subscribe({
          next: devices => {
            if (isConnecting || !devices.some(({ id }) => id === input.connectedDevice.id)) {
              return;
            }
            isConnecting = true;
            input.dmk
              .connect({
                device: input.connectedDevice,
                sessionRefresherOptions: { isRefresherDisabled: true },
              })
              .then(() => {
                sendBack({
                  type: PreChecksStateMachineEventType.DEVICE_RECONNECTED,
                });
              })
              .catch(() => {
                isConnecting = false;
              });
          },
        });
      return () => {
        subscription.unsubscribe();
      };
    }),
  },
  actions: {
    sendStateUpdate: enqueueActions(({ context, enqueue }, state: PreChecksState) => {
      if (context.lastSentState !== null && isSameState(context.lastSentState, state)) {
        return;
      }
      enqueue.sendTo(context.parentRef, {
        type: OsUpdatesOrchestratorStateMachineEventType.STATE_UPDATE,
        state,
      });
      enqueue.assign({ lastSentState: state });
    }),
    sendStop: sendTo(({ context }) => context.parentRef, {
      type: OsUpdatesOrchestratorStateMachineEventType.STOP,
    } as const),
  },
  guards: {
    isBootloaderOrOsu: ({ context }) =>
      context.osVersion !== null && (context.osVersion.isBootloader || context.osVersion.isOsu),
    hasOsUpdateToPerform: ({ context }) => context.osUpdates.length > 0,
    hasBattery: ({ context }) => DEVICE_MODELS_WITH_BATTERY.has(context.connectedDevice.modelId),
    isDeviceLocked: ({ context }) => isDeviceLockedError(context.error),
    isDeviceDisconnected: ({ context }) => isDeviceDisconnectedError(context.error),
  },
  delays: {
    poll: POLL_INTERVAL_MS,
    sessionSettleTimeout: SESSION_SETTLE_TIMEOUT_MS,
  },
}).createMachine({
  id: "preChecks",
  context: ({ input, self }) => ({
    ...input,
    lastSentState: null,
    lastAction: null,
    batteryPercentage: 0,
    osVersion: null,
    error: null,
    nextAction: null,
    send: self.send,
  }),
  initial: "WaitingForAppAndVersion",
  states: {
    WaitingForAppAndVersion: {
      entry: assign({ lastAction: PreChecksStateMachineLastAction.WaitForAppAndVersion }),
      invoke: {
        src: "waitForAppAndVersion",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
          daInput: { unlockTimeout: context.unlockTimeout },
        }),
        onSnapshot: {
          actions: {
            type: "sendStateUpdate",
            params: ({ event }) =>
              event.snapshot.context.intermediateValue?.requiredUserInteraction ===
              UserInteractionRequired.UnlockDevice
                ? { type: PreChecksStateType.DEVICE_LOCKED }
                : { type: PreChecksStateType.LOADING },
          },
        },
        onDone: [
          {
            guard: ({ event }) => event.output.isLeft(),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "CheckErrorCause",
          },
          {
            guard: ({ event }) =>
              event.output.map(({ name }) => isDashboardName(name)).orDefault(false),
            target: "GetOsVersion",
          },
          {
            target: "GoToDashboard",
          },
        ],
      },
    },
    GoToDashboard: {
      invoke: {
        src: "goToDashboard",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
          daInput: { unlockTimeout: context.unlockTimeout },
        }),
        onSnapshot: {
          actions: {
            type: "sendStateUpdate",
            params: ({ event }) =>
              event.snapshot.context.intermediateValue?.requiredUserInteraction ===
              UserInteractionRequired.UnlockDevice
                ? { type: PreChecksStateType.DEVICE_LOCKED }
                : { type: PreChecksStateType.LOADING },
          },
        },
        onDone: [
          {
            guard: ({ event }) => event.output.isLeft(),
            actions: assign({ error: ({ event }) => event.output.extract() }),
            target: "CheckErrorCause",
          },
          {
            target: "WaitingForAppAndVersion",
          },
        ],
      },
    },
    GetOsVersion: {
      invoke: {
        src: "getOsVersion",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
        }),
        onDone: {
          actions: assign({ osVersion: ({ event }) => event.output }),
          target: "CheckOsVersion",
        },
        onError: {
          actions: assign({ error: ({ event }) => event.error }),
            target: "CheckErrorCause",
        },
      },
    },
    CheckOsVersion: {
      always: [
        {
          guard: "isBootloaderOrOsu",
          actions: assign({ nextAction: PreChecksNextAction.PerformOsUpdates }),
          target: "Done",
        },
        {
          target: "CheckOsUpdates",
        },
      ],
    },
    CheckOsUpdates: {
      always: [
        {
          guard: "hasOsUpdateToPerform",
          target: "CheckDeviceModel",
        },
        {
          target: "CheckExistingBackup",
        },
      ],
    },
    CheckDeviceModel: {
      always: [
        {
          guard: "hasBattery",
          target: "GetBatteryStatus",
        },
        {
          actions: assign({ nextAction: PreChecksNextAction.PerformOsUpdates }),
          target: "Done",
        },
      ],
    },
    CheckExistingBackup: {
      invoke: {
        src: "getBackup",
        input: ({ context }) => ({
          storage: context.storage,
          deviceId: context.connectedDevice.id,
        }),
        onDone: [
          {
            guard: ({ event }) => event.output !== undefined,
            actions: assign({ nextAction: PreChecksNextAction.RestoreBackup }),
            target: "Done",
          },
          {
            actions: assign({ nextAction: PreChecksNextAction.Completed }),
            target: "Done",
          },
        ],
        onError: {
          actions: assign({ error: ({ event }) => event.error }),
          target: "UnrecoverableError",
        },
      },
    },
    GetBatteryStatus: {
      entry: assign({ lastAction: PreChecksStateMachineLastAction.GetBatteryStatus }),
      invoke: {
        src: "getBatteryStatus",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
        }),
        onDone: [
          {
            guard: ({ event }) =>
              event.output.percentage >= MIN_BATTERY_PERCENTAGE || event.output.isCharging,
            actions: assign({
              nextAction: PreChecksNextAction.PerformOsUpdates,
            }),
            target: "Done",
          },
          {
            actions: assign({
              batteryPercentage: ({ event }) => event.output.percentage,
            }),
            target: "AwaitingChargingMode",
          },
        ],
        onError: {
          actions: assign({ error: ({ event }) => event.error }),
          target: "CheckErrorCause",
        },
      },
    },
    AwaitingChargingMode: {
      entry: {
        type: "sendStateUpdate",
        params: ({ context }) => ({
          type: PreChecksStateType.BATTERY_TOO_LOW,
          currentPercentage: context.batteryPercentage,
          cancel: () => context.send({ type: PreChecksStateMachineEventType.CANCEL }),
        }),
      },
      after: {
        poll: "GetBatteryStatus",
      },
      on: {
        [PreChecksStateMachineEventType.CANCEL]: "Canceled",
      },
    },
    CheckErrorCause: {
      always: [
        {
          guard: "isDeviceLocked",
          target: "AwaitingDeviceUnlock",
        },
        {
          guard: "isDeviceDisconnected",
          target: "AwaitingDeviceReconnection",
        },
        {
          target: "IdentifyConnectionLoss",
        },
      ],
    },
    // The session keeps reporting CONNECTED after an APDU already failed from a drop: it only
    // flips to NOT_CONNECTED once the transport gives up reconnecting. Wait that window out
    // instead of treating the lag as unexpected, and keep showing the last state meanwhile.
    IdentifyConnectionLoss: {
      invoke: {
        src: "listenUntilDisconnected",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
        }),
      },
      on: {
        [PreChecksStateMachineEventType.DEVICE_DISCONNECTED]: "AwaitingDeviceReconnection",
      },
      after: {
        sessionSettleTimeout: "ProbeUnknownError",
      },
    },
    // Disconnect is unlikely after IdentifyConnectionLoss timed out. This single GetAppAndVersion
    // is a last attempt to catch a PIN lock swallowed into UnknownDAError (DA onError keeps the message, drops _tag).
    // Do not loop back to IdentifyConnectionLoss. Stay on LOADING until the probe classifies.
    ProbeUnknownError: {
      invoke: {
        src: "getAppAndVersion",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.connectedDevice.sessionId,
        }),
        onDone: {
          target: "ResumeLastAction",
        },
        onError: {
          actions: assign({ error: ({ event }) => event.error }),
          target: "CheckProbedErrorCause",
        },
      },
    },
    CheckProbedErrorCause: {
      always: [
        {
          guard: "isDeviceLocked",
          target: "AwaitingDeviceUnlock",
        },
        {
          guard: "isDeviceDisconnected",
          target: "AwaitingDeviceReconnection",
        },
        {
          target: "UnrecoverableError",
        },
      ],
    },
    AwaitingDeviceUnlock: {
      entry: {
        type: "sendStateUpdate",
        params: { type: PreChecksStateType.DEVICE_LOCKED },
      },
      initial: "Waiting",
      states: {
        Waiting: {
          after: {
            poll: "Probing",
          },
        },
        Probing: {
          invoke: {
            src: "getAppAndVersion",
            input: ({ context }) => ({
              dmk: context.dmk,
              sessionId: context.connectedDevice.sessionId,
            }),
            onDone: {
              target: "#preChecks.ResumeLastAction",
            },
            onError: {
              actions: assign({ error: ({ event }) => event.error }),
              target: "#preChecks.CheckErrorCause",
            },
          },
        },
      },
    },
    AwaitingDeviceReconnection: {
      entry: {
        type: "sendStateUpdate",
        params: { type: PreChecksStateType.DEVICE_DISCONNECTED },
      },
      invoke: {
        src: "reconnectToSameDevice",
        input: ({ context }) => ({
          dmk: context.dmk,
          connectedDevice: context.connectedDevice,
        }),
      },
      on: {
        [PreChecksStateMachineEventType.DEVICE_RECONNECTED]: "ResumeLastAction",
      },
    },
    ResumeLastAction: {
      entry: {
        type: "sendStateUpdate",
        params: { type: PreChecksStateType.LOADING },
      },
      always: Object.entries(resumeTarget).map(([lastAction, target]) => ({
        guard: ({ context }: { context: PreChecksStateMachineContext }) =>
          context.lastAction === lastAction,
        target,
      })),
    },
    UnrecoverableError: {
      entry: {
        type: "sendStateUpdate",
        params: ({ context }) => ({
          type: PreChecksStateType.UNEXPECTED_ERROR,
          cancel: () => context.send({ type: PreChecksStateMachineEventType.CANCEL }),
        }),
      },
      on: {
        [PreChecksStateMachineEventType.CANCEL]: "Canceled",
      },
    },
    Canceled: {
      entry: "sendStop",
    },
    Done: {
      type: "final",
    },
  },
  output: ({ context }) => context.nextAction!,
});
