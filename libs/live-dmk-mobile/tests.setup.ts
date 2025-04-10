import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

vi.mock("react-native", () => ({
  Platform: {},
  PermissionsAndroid: {},
}));

vi.mock("react-native-ble-plx", () => ({
  BleError: class extends Error {
    constructor(message: string) {
      super(message);
      this.reason = message;
    }
    reason: string;
  },
  State: {
    PoweredOn: "PoweredOn",
    PoweredOff: "PoweredOff",
  },
  BleManager: vi.fn().mockImplementation(() => ({
    onStateChange: vi.fn(),
    stopDeviceScan: vi.fn(),
    startDeviceScan: vi.fn(),
  })),
}));
