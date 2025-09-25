import "@testing-library/react-native/extend-expect";
import "react-native-gesture-handler/jestSetup";
import "@shopify/flash-list/jestSetup";
import "@mocks/console";
import { server } from "./server";
import { NativeModules } from "react-native";
// Needed for react-reanimated https://docs.swmansion.com/react-native-reanimated/docs/3.x/guides/testing#timers
jest.useFakeTimers();
jest.runAllTimers();

beforeAll(() =>
  server.listen({
    onUnhandledRequest: "bypass",
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

const mockPermissions = {
  status: "granted",
  expires: "never",
  canAskAgain: true,
  granted: true,
};

export const mockSimulateBarcodeScanned = jest.fn();

jest.mock("expo-camera", () => {
  return {
    CameraView: jest.fn(({ onBarcodeScanned }) => {
      mockSimulateBarcodeScanned.mockImplementation(onBarcodeScanned);
      return null;
    }),
    useCameraPermissions: jest.fn(() => [
      mockPermissions,
      jest.fn(() => Promise.resolve(mockPermissions)),
      jest.fn(() => Promise.resolve(mockPermissions)),
    ]),
  };
});

jest.mock("~/analytics/segment", () => ({
  track: jest.fn(),
  setAnalyticsFeatureFlagMethod: jest.fn(),
  screen: jest.fn(),
  useAnalytics: jest.fn(() => ({
    track: jest.fn(),
    screen: jest.fn(),
    identify: jest.fn(),
    group: jest.fn(),
    alias: jest.fn(),
    reset: jest.fn(),
  })),
}));

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

jest.mock("@gorhom/bottom-sheet", () => require("@gorhom/bottom-sheet/mock"));

jest.mock("react-native-version-number", () => ({
  appVersion: "1.0.0",
  buildVersion: "1",
}));

jest.mock("react-native-startup-time", () => ({
  getStartupTime: jest.fn(),
}));

jest.mock("@react-native-community/netinfo", () => ({ useNetInfo: () => ({ isConnected: true }) }));

require("react-native-reanimated").setUpTests();

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing

jest.mock("~/analytics", () => ({
  ...jest.requireActual("~/analytics"),
  track: jest.fn(),
}));

jest.mock("@react-native-firebase/messaging", () => ({
  getMessaging: jest.fn(() => ({
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
// eslint-disable-next-line no-console
const originalLog = console.log;

const EXCLUDED_ERRORS = ["act(...)"];

const EXCLUDED_WARNINGS = [
  "[Reanimated] Writing",
  "[Reanimated] Reading",
  'getHost: "Invalid non-string URL" for scriptURL',
  "@polkadot",
  "Node of type rule not supported as an inline style",
];

const EXCLUDED_LOG_MESSAGES = ["Shims Injected", "Missing FileReader", "nextTick"];

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
// eslint-disable-next-line no-console
console.log = (...args) => {
  const log = args.join();
  if (EXCLUDED_LOG_MESSAGES.some(excluded => log.includes(excluded))) {
    return;
  }
  originalLog.call(console, ...args);
};
