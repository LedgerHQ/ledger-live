import { AnyEventObject, assign, enqueueActions, setup } from "xstate";
import { track } from "~/renderer/analytics/segment";
// Solutions
import ChangeUSBCable from "./solutions/ChangeUSBCable";
import DifferentPort from "./solutions/DifferentPort";
import RestartComputer from "./solutions/RestartComputer";
import RunAsAdmin from "./solutions/RunAsAdmin";
import TryAnotherComputer from "./solutions/TryAnotherComputer";
import TurnOffAntivirus from "./solutions/TurnOffAntivirus";
import UpdateUdevRules from "./solutions/UpdateUdevRules";
import UpdateUSBDeviceDrivers from "./solutions/UpdateUSBDeviceDrivers";
import EnableFullDiskAccess from "./solutions/EnableFullDiskAccess";
import ResetNVRAM from "./solutions/ResetNVRAM";
import RepairFunnel from "./solutions/RepairFunnel";

const commonSolutions = [
  DifferentPort,
  ChangeUSBCable,
  RestartComputer,
  TurnOffAntivirus,
  TryAnotherComputer,
];

const detectedPlatform =
  process.platform === "darwin" ? "mac" : process.platform === "win32" ? "windows" : "linux";
export default setup({
  types: {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    input: {} as {
      currentIndex: number | undefined;
    },
  },
  guards: {
    noCurrentIndex: ({ context }) => context.currentIndex === undefined, // Nb Prevent 'next' if we are already in the flow,
  },
  actions: {
    load: assign(({ context }) => {
      const { platform, currentIndex, solutions } = context;
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      if (!solutions[platform as keyof typeof solutions])
        throw new Error(`Unknown platform ${platform}`);
      const index =
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        !currentIndex || currentIndex >= solutions[platform as keyof typeof solutions].length
          ? 0
          : currentIndex;
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const SolutionComponent = solutions[platform as keyof typeof solutions][index];
      return {
        currentIndex: index,
        SolutionComponent,
      };
    }),
    // For Nano X and Blue, after all options, we give up.
    done: assign({
      done: true,
    }),
    // Move forwards to another solution.
    next: assign(({ context }) => {
      const { platform, currentIndex: i, solutions } = context;
      const currentIndex =
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        solutions[platform as keyof typeof solutions].length > i! + 1 ? i! + 1 : i;
      return {
        currentIndex,
      };
    }),
    // Move back to a previous solution.
    previous: assign(({ context }) => {
      const { platform, currentIndex: i, solutions } = context;
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const currentIndex = solutions[platform as keyof typeof solutions].length <= 0 ? 0 : i! - 1;
      return {
        currentIndex,
        done: false,
      };
    }),
    // Tracking actions
    log: ({ context, event }) =>
      track(`USBTroubleshooting ${event.type}`, {
        event,
        detectedPlatform,
        currentIndex: context.currentIndex,
      }),
  },
}).createMachine({
  id: "USBTroubleshooting",
  initial: "solution",
  context: ({ input }) => ({
    opened: true,
    done: false,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    SolutionComponent: (() => null) as React.ComponentType<{
      number: number;
      sendEvent: (event: AnyEventObject) => unknown;
      done: boolean;
    }> | null,
    platform: process.env.USBTROUBLESHOOTING_PLATFORM || detectedPlatform,
    currentIndex: input.currentIndex,
    solutions: {
      mac: [...commonSolutions, EnableFullDiskAccess, ResetNVRAM, RepairFunnel],
      windows: [RunAsAdmin, ...commonSolutions, UpdateUSBDeviceDrivers, RepairFunnel],
      linux: [UpdateUdevRules, ...commonSolutions, RepairFunnel],
    },
  }),
  states: {
    solution: {
      entry: [
        enqueueActions(({ enqueue, check }) => {
          if (check("noCurrentIndex")) {
            enqueue("next");
          }
          enqueue("load");
          enqueue("log");
        }),
      ],
      on: {
        NEXT: {
          actions: ["next", "load", "log"],
        },
        PREVIOUS: {
          actions: ["previous", "load", "log"],
        },
        DONE: {
          actions: ["done", "log"],
        },
      },
    },
  },
});
