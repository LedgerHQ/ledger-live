import type { DeviceOnboardingToolProps } from "../src/types";

export function buildProps(
  overrides: Partial<DeviceOnboardingToolProps> = {},
): DeviceOnboardingToolProps {
  return {
    status: "idle",
    device: null,
    state: null,
    context: null,
    events: [],
    exit: null,
    sendableEvents: [],
    error: null,
    connect: jest.fn(),
    send: jest.fn(),
    reset: jest.fn(),
    ...overrides,
  };
}
