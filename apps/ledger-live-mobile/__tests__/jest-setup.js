import "@testing-library/react-native/extend-expect";
import "react-native-gesture-handler/jestSetup";
import "@shopify/flash-list/jestSetup";
import "@mocks/console";
import { ALLOWED_UNHANDLED_REQUESTS } from "./handlers";
import { server } from "./server";
import { NativeModules } from "react-native";
import { MockedExpoCamera, MockedCameraType } from "../__mocks__/MockedExpoCamera";
// Needed for react-reanimated https://docs.swmansion.com/react-native-reanimated/docs/next/guide/testing/
jest.useFakeTimers();
jest.runAllTimers();

beforeAll(() =>
  server.listen({
    onUnhandledRequest(request, print) {
      if (ALLOWED_UNHANDLED_REQUESTS.some(ignoredUrl => request.url.includes(ignoredUrl))) {
        return;
      }
      print.warning();
    },
  }),
);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

NativeModules.RNAnalytics = {};

const mockAnalytics = jest.genMockFromModule("@segment/analytics-react-native");

// Overriding the default RNGH mocks
// to replace TouchableNativeFeedback with TouchableOpacity
// as the former breaks tests trying to press buttons
jest.mock("react-native-gesture-handler", () => {
  const TouchableOpacity = require("react-native").TouchableOpacity;
  return {
    ...require("react-native-gesture-handler/lib/commonjs/mocks").default,
    RawButton: TouchableOpacity,
    BaseButton: TouchableOpacity,
    RectButton: TouchableOpacity,
    BorderlessButton: TouchableOpacity,
  };
});

jest.mock("@segment/analytics-react-native", () => mockAnalytics);

jest.mock("react-native-launch-arguments", () => ({}));

NativeModules.BluetoothHelperModule = {
  E_BLE_CANCELLED: "BLE_UNKNOWN_STATE",
};

jest.mock("react-native-share", () => ({
  default: jest.fn(),
}));

jest.mock("expo-camera/legacy", () => {
  return {
    Camera: MockedExpoCamera,
    CameraType: MockedCameraType,
  };
});

jest.mock("expo-barcode-scanner", () => ({
  BarCodeScanner: {
    Constants: {
      BarCodeType: {
        qr: "qr",
      },
    },
  },
}));

jest.mock("expo-camera", () => {
  return {
    CameraView: jest.fn(() => null),
  };
});

// Mock of Native Modules
jest.mock("react-native-localize", () => ({
  getTimeZone: jest.fn(),
  getLocales: jest.fn(),
  getNumberFormatSettings: jest.fn(),
  getCalendar: jest.fn(),
  getCountry: jest.fn(),
  getTemperatureUnit: jest.fn(),
  getFirstWeekDay: jest.fn(),
  uses24HourClock: jest.fn(),
  findBestAvailableLanguage: jest.fn(),
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

jest.mock("react-native-version-number", () => ({
  appVersion: "1.0.0",
  buildVersion: "1",
}));

jest.mock("react-native-startup-time", () => ({
  getStartupTime: jest.fn(),
}));

jest.mock("@react-native-community/netinfo", () => ({ useNetInfo: () => ({ isConnected: true }) }));

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");

  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {};

  return Reanimated;
});

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper");

jest.mock("~/analytics", () => ({
  ...jest.requireActual("~/analytics"),
  track: jest.fn(),
}));

jest.mock("@react-native-firebase/messaging", () => ({
  messaging: jest.fn(() => ({
    hasPermission: jest.fn(() => Promise.resolve(true)),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
    requestPermission: jest.fn(() => Promise.resolve(true)),
    getToken: jest.fn(() => Promise.resolve("myMockToken")),
  })),
  notifications: jest.fn(() => ({
    onNotification: jest.fn(),
    onNotificationDisplayed: jest.fn(),
  })),
  analytics: jest.fn(() => ({
    logEvent: jest.fn(),
  })),
}));

jest.mock("@braze/react-native-sdk", () => ({}));

jest.mock("react-native-webview", () => jest.fn());

jest.mock("react-native-device-info", () => ({
  getDeviceNameSync: jest.fn(() => "Mocked Device"),
}));

const originalError = console.error;
const originalWarn = console.warn;

const EXCLUDED_ERRORS = [];

const EXCLUDED_WARNINGS = [];

console.error = (...args) => {
  const error = args.join();
  if (EXCLUDED_ERRORS.some(excluded => error.includes(excluded))) {
    return;
  }
  originalError.call(console, ...args);
};

console.warn = (...args) => {
  const warning = args.join();
  if (EXCLUDED_WARNINGS.some(excluded => warning.includes(excluded))) {
    return;
  }
  originalWarn.call(console, ...args);
};
