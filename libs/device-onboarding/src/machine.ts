import { setup } from "xstate";
import { firmwareCheck } from "./actors/firmwareCheck";
import { genuineCheck } from "./actors/genuineCheck";
import { readDeviceState } from "./actors/readDeviceState";
import { toggleEarlyCheck } from "./actors/toggleEarlyCheck";
import {
  contextActions,
  currentVerdict,
  exitContract,
  initialContext,
  type ExitOutput,
} from "./context";
import { EarlyCheckToggle } from "./device/toggleEarlyCheckCommand";
import { isTouchscreen, requiresLegacyFlow } from "./rules";
import type {
  DeviceOnboardingContext,
  DeviceOnboardingInput,
  DeviceOnboardingOutput,
  OnboardingEvent,
} from "./types";

export const deviceOnboardingMachine = setup({
  types: {
    context: {} as DeviceOnboardingContext,
    events: {} as OnboardingEvent,
    input: {} as DeviceOnboardingInput,
    output: {} as DeviceOnboardingOutput,
  },
  actors: { readDeviceState, genuineCheck, firmwareCheck, toggleEarlyCheck },
  actions: contextActions,
  guards: {
    requiresLegacyFlow: ({ context }) =>
      context.firmwareVersion === null ||
      requiresLegacyFlow({
        currentVersion: context.firmwareVersion,
        deviceModelId: context.deviceModelId,
      }),
    deviceNotGenuine: ({ context }) => currentVerdict(context)?.isGenuine === false,
    canShowEarlyCheck: ({ context }) =>
      isTouchscreen(context.deviceModelId) &&
      !context.isOnboarded &&
      currentVerdict(context) === null,
    shouldRunGenuineCheck: ({ context }) =>
      !context.checksPaused && currentVerdict(context) === null,
    shouldRunFirmwareCheck: ({ context }) =>
      !context.checksPaused &&
      currentVerdict(context)?.isGenuine === true &&
      !context.firmwareChecked,
    updateAwaitingAnswer: ({ context }) =>
      !context.checksPaused && context.availableFirmwareUpdate !== null && !context.firmwareChecked,
    checksAlreadyPassed: ({ context }) =>
      currentVerdict(context)?.isGenuine === true && context.firmwareChecked,
    onEarlyCheckScreen: ({ context }) => context.onEarlyCheckScreen,
    isOnboarded: ({ context }) => context.isOnboarded,
    offerSync: ({ context }) => context.offerSync,
  },
}).createMachine({
  id: "deviceOnboarding",
  context: ({ input }) => initialContext(input),
  initial: "readingState",
  on: {
    LOCKED: { target: ".deviceLocked", actions: "leaveEarlyCheckScreen" },
    TRANSPORT_LOST: { target: ".awaitingSession", actions: "leaveEarlyCheckScreen" },
    QUIT: ".exitOnboarding",
  },
  output: ({ context, event }) => exitContract(context, event.output),
  states: {
    readingState: {
      invoke: {
        src: "readDeviceState",
        input: ({ context }) => ({ dmk: context.dmk, sessionId: context.ports.currentSessionId() }),
      },
      on: {
        DEVICE_STATE_READ: { target: "routing", actions: "rememberDeviceState" },
        DEVICE_STATE_UNREADABLE: { target: "routing", actions: "rememberUnreadableDeviceState" },
        DEVICE_STATE_FAILED: "legacyFallback",
        DEVICE_IN_BOOTLOADER: "bootloaderRecovery",
        DEVICE_IN_OSU: "bootloaderRecovery",
      },
    },

    routing: {
      always: [
        { guard: "deviceNotGenuine", target: "checks.notGenuineSupport" },
        { guard: "requiresLegacyFlow", target: "legacyFallback" },
        { guard: "canShowEarlyCheck", target: "checks.enteringEarlyCheckScreen" },
        { target: "checks.checksIdle" },
      ],
    },

    checks: {
      initial: "checksIdle",
      states: {
        enteringEarlyCheckScreen: {
          invoke: {
            src: "toggleEarlyCheck",
            input: ({ context }) => ({
              dmk: context.dmk,
              sessionId: context.ports.currentSessionId(),
              toggle: EarlyCheckToggle.Enter,
            }),
          },
          on: {
            EARLY_CHECK_TOGGLED: { target: "checksIdle", actions: "enterEarlyCheckScreen" },
            EARLY_CHECK_UNAVAILABLE: "checksIdle",
          },
        },

        checksIdle: {
          always: [
            { guard: "shouldRunGenuineCheck", target: "genuineCheck" },
            { guard: "updateAwaitingAnswer", target: "firmwareUpdateOffered" },
            { guard: "shouldRunFirmwareCheck", target: "firmwareCheck" },
            { guard: "checksAlreadyPassed", target: "checksDone" },
          ],
          on: { RETRY: { actions: "resumeChecks" } },
        },

        genuineCheck: {
          invoke: {
            src: "genuineCheck",
            input: ({ context }) => ({
              dmk: context.dmk,
              sessionId: context.ports.currentSessionId(),
            }),
          },
          on: {
            ALLOW_SECURE_CONNECTION_REQUESTED: { actions: "rememberSecureConnectionRequested" },
            GENUINE_CHECK_PASSED: { target: "checksIdle", actions: "rememberGenuineChecked" },
            GENUINE_CHECK_REFUSED: { target: "genuineFailed", actions: "rememberGenuineFailure" },
            GENUINE_CHECK_FAILED: { target: "genuineFailed", actions: "rememberGenuineFailure" },
            SECURE_CHANNEL_LOST: { target: "genuineFailed", actions: "rememberGenuineFailure" },
            DEVICE_NOT_GENUINE: { target: "notGenuineSupport", actions: "rememberGenuineFailure" },
          },
        },

        genuineFailed: {
          on: {
            RETRY: { target: "genuineCheck", actions: "clearGenuineFailure" },
            CLOSE: { target: "checksIdle", actions: "pauseChecks" },
          },
        },

        notGenuineSupport: {},

        firmwareCheck: {
          invoke: {
            src: "firmwareCheck",
            input: ({ context }) => ({
              dmk: context.dmk,
              sessionId: context.ports.currentSessionId(),
            }),
          },
          on: {
            FIRMWARE_UP_TO_DATE: { target: "checksDone", actions: "rememberFirmwareChecked" },
            FIRMWARE_UPDATE_AVAILABLE: {
              target: "firmwareUpdateOffered",
              actions: "rememberAvailableUpdate",
            },
            FIRMWARE_CHECK_FAILED: "firmwareCheckFailed",
          },
        },

        firmwareCheckFailed: {
          on: {
            RETRY: "firmwareCheck",
            SKIP: { target: "checksDone", actions: "rememberFirmwareChecked" },
            CLOSE: { target: "checksIdle", actions: "pauseChecks" },
          },
        },

        firmwareUpdateOffered: {
          on: {
            USER_ACCEPT: "firmwareUpdateDelegated",
            USER_DECLINE: { target: "checksDone", actions: "rememberFirmwareChecked" },
          },
        },

        firmwareUpdateDelegated: {
          on: {
            LOCKED: { actions: "leaveEarlyCheckScreen" },
            TRANSPORT_LOST: { actions: "leaveEarlyCheckScreen" },
            FIRMWARE_UPDATE_FLOW_CLOSED: {
              target: "#deviceOnboarding.readingState",
              actions: ["forgetUpdatedDevice", "carryAttestationThroughReboot"],
            },
          },
        },

        checksDone: {
          always: [
            { guard: "onEarlyCheckScreen", target: "leavingEarlyCheckScreen" },
            { target: "checksSucceeded" },
          ],
        },

        leavingEarlyCheckScreen: {
          invoke: {
            src: "toggleEarlyCheck",
            input: ({ context }) => ({
              dmk: context.dmk,
              sessionId: context.ports.currentSessionId(),
              toggle: EarlyCheckToggle.Exit,
            }),
          },
          on: {
            EARLY_CHECK_TOGGLED: { target: "checksSucceeded", actions: "leaveEarlyCheckScreen" },
            EARLY_CHECK_UNAVAILABLE: {
              target: "checksSucceeded",
              actions: "leaveEarlyCheckScreen",
            },
          },
        },

        checksSucceeded: {
          on: {
            CONTINUE: [
              { guard: "isOnboarded", target: "#deviceOnboarding.onboardedExit" },
              { target: "#deviceOnboarding.deviceSetup" },
            ],
          },
        },
      },
    },

    onboardedExit: {
      always: [{ guard: "offerSync", target: "syncOffer" }, { target: "done" }],
    },

    // The setup phase and the two exits it reaches are LIVE-36064.
    deviceSetup: {},
    syncOffer: {},
    done: {},

    deviceLocked: { on: { UNLOCKED: "readingState" } },
    awaitingSession: { on: { SESSION_READY: "readingState" } },

    legacyFallback: { type: "final", output: { reason: "legacyFallback" } satisfies ExitOutput },
    bootloaderRecovery: {
      type: "final",
      output: { reason: "resumeFirmwareUpdate" } satisfies ExitOutput,
    },
    exitOnboarding: { type: "final", output: { reason: "userQuit" } satisfies ExitOutput },
  },
});
