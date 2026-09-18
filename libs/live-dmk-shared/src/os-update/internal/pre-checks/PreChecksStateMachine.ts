import {
  BatteryStatusType,
  DeviceSessionId,
  GetBatteryStatusCommand,
  GetOsVersionCommand,
  GoToDashboardDeviceAction,
  isDashboardName,
  isSuccessCommandResult,
  UserInteractionRequired,
  WaitForAppAndVersionDeviceAction,
  type DeviceManagementKit,
  type GetOsVersionResponse,
  type GoToDashboardDAInput,
  type WaitForAppAndVersionDAInput,
} from "@ledgerhq/device-management-kit";
import type { Backup } from "@ledgerhq/dmk-ledger-wallet";
import { assign, enqueueActions, fromPromise, sendTo, setup } from "xstate";
import { createDeviceActionStateMachine } from "../../../device-action/CreateDeviceActionStateMachine/createDeviceActionStateMachine";
import type { DeviceBackupStorage } from "../../api/model/DeviceBackupStorage";
import { PreChecksStateType, type PreChecksState } from "../../api/model/PreChecksState";
import { OsUpdatesOrchestratorStateMachineEventType } from "../orchestrator/types";
import { checkErrorCauseStateMachine } from "../shared/checkErrorCauseStateMachine";
import { POLL_INTERVAL_MS } from "../shared/constants";
import { CheckErrorCauseResult, DeviceSituationEventType } from "../shared/types";
import {
  CHARGING_MODE_NONE,
  DEVICE_MODELS_WITH_BATTERY,
  MIN_BATTERY_PERCENTAGE,
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
import { toPreChecksState } from "./utils/toPreChecksState";

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
    checkErrorCause: checkErrorCauseStateMachine,
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
  },
  delays: {
    poll: POLL_INTERVAL_MS,
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
  on: {
    [DeviceSituationEventType.DEVICE_SITUATION_UPDATE]: {
      actions: {
        type: "sendStateUpdate",
        params: ({ event }) => toPreChecksState(event.situation),
      },
    },
  },
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
            params: ({ event }) => {
              const requiredUserInteraction =
                event.snapshot.context.intermediateValue?.requiredUserInteraction;
              switch (requiredUserInteraction) {
                case UserInteractionRequired.UnlockDevice:
                  return { type: PreChecksStateType.DEVICE_LOCKED };
                case UserInteractionRequired.None:
                case undefined:
                  return { type: PreChecksStateType.LOADING };
                default: {
                  const unhandled: never = requiredUserInteraction;
                  return unhandled;
                }
              }
            },
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
            params: ({ event }) => {
              const requiredUserInteraction =
                event.snapshot.context.intermediateValue?.requiredUserInteraction;
              switch (requiredUserInteraction) {
                case UserInteractionRequired.UnlockDevice:
                  return { type: PreChecksStateType.DEVICE_LOCKED };
                case UserInteractionRequired.None:
                case undefined:
                  return { type: PreChecksStateType.LOADING };
                default: {
                  const unhandled: never = requiredUserInteraction;
                  return unhandled;
                }
              }
            },
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
          actions: assign({ nextAction: PreChecksNextAction.CreateBackup }),
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
              nextAction: PreChecksNextAction.CreateBackup,
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
      invoke: {
        src: "checkErrorCause",
        input: ({ context, self }) => ({
          dmk: context.dmk,
          connectedDevice: context.connectedDevice,
          error: context.error,
          hostRef: self,
        }),
        onDone: [
          {
            guard: ({ event }) => event.output === CheckErrorCauseResult.Recovered,
            target: "ResumeLastAction",
          },
          {
            target: "UnrecoverableError",
          },
        ],
        onError: {
          target: "UnrecoverableError",
        },
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
