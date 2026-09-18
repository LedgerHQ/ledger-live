import { setup } from "xstate";
import { firmwareCheck } from "./actors/firmwareCheck";
import { genuineCheck } from "./actors/genuineCheck";
import { readDeviceState } from "./actors/readDeviceState";
import { seedPolling } from "./actors/seedPolling";
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
import {
  isWelcomeStep,
  OnboardingStep,
  type DeviceOnboardingContext,
  type DeviceOnboardingInput,
  type DeviceOnboardingOutput,
  type OnboardingEvent,
} from "./types";

function stepIs(...steps: OnboardingStep[]) {
  const matching = new Set(steps);

  return ({ event }: { event: OnboardingEvent }) =>
    event.type === "STEP_CHANGED" && matching.has(event.state.currentOnboardingStep);
}

const stopsHere = {};

export const deviceOnboardingMachine = setup({
  types: {
    context: {} as DeviceOnboardingContext,
    events: {} as OnboardingEvent,
    input: {} as DeviceOnboardingInput,
    output: {} as DeviceOnboardingOutput,
  },
  actors: { readDeviceState, genuineCheck, firmwareCheck, toggleEarlyCheck, seedPolling },
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
      !context.checksPaused &&
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
    onboardedOnEntry: ({ context }) => context.onboardedOnEntry === true,
    offerSync: ({ context }) => context.offerSync,
    deviceRestarted: ({ context, event }) =>
      event.type === "STEP_CHANGED" &&
      isWelcomeStep(event.state.currentOnboardingStep) &&
      context.currentSetupStep !== null,
    deviceIsReady: stepIs(OnboardingStep.Ready),
    stepNaming: stepIs(OnboardingStep.ChooseName),
    stepPin: stepIs(OnboardingStep.Pin),
    stepSetupChoice: stepIs(OnboardingStep.SetupChoice),
    stepNewSeed: stepIs(OnboardingStep.NewDevice, OnboardingStep.NewDeviceConfirming),
    stepRestoreChoice: stepIs(OnboardingStep.SetupChoiceRestore),
    stepRestoreWords: stepIs(OnboardingStep.RestoreSeed),
    stepRestoreRecover: stepIs(OnboardingStep.RecoverRestore),
    stepRestoreRecoveryKey: stepIs(OnboardingStep.RestoreCharon),
  },
}).createMachine({
  id: "deviceOnboarding",
  context: ({ input }) => initialContext(input),
  initial: "readingState",
  on: {
    LOCKED: ".deviceLocked",
    TRANSPORT_LOST: ".awaitingSession",
    QUIT: ".quitting",
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
          exit: "forgetSecureConnectionRequested",
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
            RETRY: { target: "genuineCheck", actions: ["forgetGenuineFailure", "resumeChecks"] },
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
            LOCKED: stopsHere,
            TRANSPORT_LOST: stopsHere,
            QUIT: stopsHere,
            FIRMWARE_UPDATE_FLOW_CLOSED: {
              target: "#deviceOnboarding.readingState",
              actions: ["forgetFirmwareCheck", "carryAttestationThroughReboot"],
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
              { guard: "onboardedOnEntry", target: "#deviceOnboarding.onboardedExit" },
              { target: "#deviceOnboarding.deviceSetup" },
            ],
          },
        },
      },
    },

    onboardedExit: {
      always: [{ guard: "offerSync", target: "syncOffer" }, { target: "done" }],
    },

    deviceSetup: {
      initial: "waiting",
      invoke: {
        src: "seedPolling",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.ports.currentSessionId(),
        }),
      },
      on: {
        STEP_CHANGED: [
          {
            guard: "deviceRestarted",
            target: "#deviceOnboarding.routing",
            actions: ["rememberSetupStep", "forgetSetupProgress"],
          },
          {
            guard: "deviceIsReady",
            target: "#deviceOnboarding.done",
            actions: "rememberSetupStep",
          },
          { guard: "stepNaming", target: ".naming", actions: "rememberSetupStep" },
          { guard: "stepPin", target: ".pin", actions: "rememberSetupStep" },
          { guard: "stepSetupChoice", target: ".setupChoice", actions: "rememberSetupStep" },
          { guard: "stepNewSeed", target: ".newSeed", actions: "rememberSetupStep" },
          { guard: "stepRestoreChoice", target: ".restoreChoice", actions: "rememberSetupStep" },
          { guard: "stepRestoreWords", target: ".restoreWords", actions: "rememberSetupStep" },
          { guard: "stepRestoreRecover", target: ".restoreRecover", actions: "rememberSetupStep" },
          {
            guard: "stepRestoreRecoveryKey",
            target: ".restoreRecoveryKey",
            actions: "rememberSetupStep",
          },
          { actions: "rememberSetupStep" },
        ],
      },
      states: {
        waiting: {},
        naming: {},
        pin: {},
        setupChoice: {},
        newSeed: {},
        restoreChoice: {},
        restoreWords: {},
        restoreRecover: {},
        restoreRecoveryKey: {},
      },
    },
    syncOffer: { type: "final", output: { reason: "offerLedgerSync" } satisfies ExitOutput },
    done: { type: "final", output: { reason: "completed" } satisfies ExitOutput },

    deviceLocked: { on: { UNLOCKED: "readingState" } },
    awaitingSession: {
      on: {
        SESSION_READY: {
          target: "readingState",
          actions: ["forgetFirmwareCheck", "forgetGenuineFailure", "resumeChecks"],
        },
      },
    },

    quitting: {
      always: [
        { guard: "onEarlyCheckScreen", target: "leavingOnQuit" },
        { target: "exitOnboarding" },
      ],
    },

    leavingOnQuit: {
      invoke: {
        src: "toggleEarlyCheck",
        input: ({ context }) => ({
          dmk: context.dmk,
          sessionId: context.ports.currentSessionId(),
          toggle: EarlyCheckToggle.Exit,
        }),
      },
      on: {
        EARLY_CHECK_TOGGLED: { target: "exitOnboarding", actions: "leaveEarlyCheckScreen" },
        EARLY_CHECK_UNAVAILABLE: { target: "exitOnboarding", actions: "leaveEarlyCheckScreen" },
      },
    },

    legacyFallback: { type: "final", output: { reason: "legacyFallback" } satisfies ExitOutput },
    bootloaderRecovery: {
      type: "final",
      output: { reason: "resumeFirmwareUpdate" } satisfies ExitOutput,
    },
    exitOnboarding: { type: "final", output: { reason: "userQuit" } satisfies ExitOutput },
  },
});
