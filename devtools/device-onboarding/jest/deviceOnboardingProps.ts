import type { DeviceOnboardingMachineState, DeviceOnboardingToolProps } from "../src/types";

/** A small slice of the onboarding machine: the root, a parent and two children. */
export const sampleMachine: DeviceOnboardingMachineState[] = [
  {
    path: "",
    key: "deviceOnboarding",
    depth: 0,
    kind: "compound",
    initial: false,
    invokes: [],
    transitions: [{ event: "LOCKED", source: "app", targets: ["deviceLocked"] }],
  },
  {
    path: "checks",
    key: "checks",
    depth: 1,
    kind: "compound",
    initial: false,
    invokes: [],
    transitions: [],
  },
  {
    path: "checks.checksIdle",
    key: "checksIdle",
    depth: 2,
    kind: "atomic",
    initial: true,
    invokes: [],
    transitions: [
      {
        event: "auto",
        source: "auto",
        targets: ["checks.genuineCheck"],
        guard: "shouldRunGenuineCheck",
      },
      { event: "RETRY", source: "user", targets: [] },
    ],
  },
  {
    path: "checks.firmwareCheck",
    key: "firmwareCheck",
    depth: 2,
    kind: "atomic",
    initial: false,
    invokes: ["firmwareCheck"],
    transitions: [],
  },
];

export function buildProps(
  overrides: Partial<DeviceOnboardingToolProps> = {},
): DeviceOnboardingToolProps {
  return {
    status: "idle",
    device: null,
    state: null,
    context: null,
    log: [],
    exit: null,
    sendableEvents: [],
    nextStates: [],
    machine: [],
    error: null,
    connect: jest.fn(),
    send: jest.fn(),
    reset: jest.fn(),
    showNextScreen: false,
    setShowNextScreen: jest.fn(),
    ...overrides,
  };
}
