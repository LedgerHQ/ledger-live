import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder as typeof global.TextEncoder;
}

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder as typeof global.TextDecoder;
}

afterEach(() => {
  cleanup();
});

jest.mock("react-native", () => ({
  Platform: {},
  PermissionsAndroid: {},
  NativeModules: {},
}));

jest.mock("react-native-ble-plx", () => ({
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
  BleManager: jest.fn().mockImplementation(() => ({
    onStateChange: jest.fn(),
    stopDeviceScan: jest.fn(),
    startDeviceScan: jest.fn(),
  })),
}));
