import type { DeviceOnboardingToolProps } from "../src/types";

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
    error: null,
    connect: jest.fn(),
    send: jest.fn(),
    reset: jest.fn(),
    showNextScreen: false,
    setShowNextScreen: jest.fn(),
    ...overrides,
  };
}
