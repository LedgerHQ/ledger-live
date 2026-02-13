import "react-native-gesture-handler/jestSetup";
import "@shopify/flash-list/jestSetup";
import "@mocks/console";
import { server } from "./server";
import { NativeModules } from "react-native";
import mockSafeAreaContext from "react-native-safe-area-context/jest/mock";
import mockRNCNetInfo from "@react-native-community/netinfo/jest/netinfo-mock.js";
import mockGorhomBottomSheet from "@gorhom/bottom-sheet/mock";
import mockAsyncStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
import mockLocalize from "react-native-localize/mock";
import { EventEmitter } from "events";

// Disable max listeners warning for MSW (known issue with multiple tests)
EventEmitter.defaultMaxListeners = 0;

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

const mockAnalytics = jest.createMockFromModule("@segment/analytics-react-native");

// Overriding the default RNGH mocks
// to replace TouchableNativeFeedback with TouchableOpacity
// as the former breaks tests trying to press buttons
jest.mock("react-native-gesture-handler", () => {
  const RN = require("react-native");
  const RNGH = jest.requireActual("react-native-gesture-handler");
  const TouchableOpacity = RN.TouchableOpacity;
  const ScrollView = RN.ScrollView;

  return {
    ...RNGH,
    TouchableOpacity,
    TouchableWithoutFeedback: TouchableOpacity,
    ScrollView,
    Pressable: TouchableOpacity,
    RawButton: TouchableOpacity,
    BaseButton: TouchableOpacity,
    RectButton: TouchableOpacity,
    BorderlessButton: TouchableOpacity,
  };
});

jest.mock("react-native-gesture-handler/ReanimatedSwipeable");

jest.mock("react-native-haptic-feedback", () => ({
  default: {
    trigger: jest.fn(),
  },
}));

jest.mock("@segment/analytics-react-native", () => mockAnalytics);

jest.mock("react-native-launch-arguments", () => ({}));

NativeModules.BluetoothHelperModule = {
  E_BLE_CANCELLED: "BLE_UNKNOWN_STATE",
};

jest.mock("react-native-share", () => ({
  default: jest.fn(),
}));

// Global mocks for Lottie and env config (used by LaunchScreen and other components)
jest.mock("lottie-react-native", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  const MockLottie = ({ source }) =>
    React.createElement(
      View,
      { testID: "lottie-mock" },
      React.createElement(Text, { testID: "lottie-source" }, JSON.stringify(source)),
    );
  return MockLottie;
});

// Mirror runtime: react-native-config exposes env as strings (e.g. "1"/"true" for DETOX).
// Use undefined so (1) DETOX_ENABLED stays false and (2) truthiness checks (Config.DETOX) are falsy in unit tests.
jest.mock("react-native-config", () => {
  const config = { DETOX: undefined };
  return {
    __esModule: true,
    get default() {
      return config;
    },
  };
});

export const mockSimulateBarcodeScanned = jest.fn();
export const mockGetCameraPermissionStatus = jest.fn(() => "granted");

jest.mock("react-native-vision-camera", () => {
  const CameraMock = jest.fn(({ codeScanner }) => {
    if (codeScanner?.onCodeScanned) {
      mockSimulateBarcodeScanned.mockImplementation(code => {
        codeScanner.onCodeScanned([code]);
      });
    }
    return null;
  });
  CameraMock.getCameraPermissionStatus = mockGetCameraPermissionStatus;

  return {
    Camera: CameraMock,
    useCameraPermission: jest.fn(() => ({
      hasPermission: true,
      requestPermission: jest.fn(() => Promise.resolve(true)),
    })),
    useCameraDevice: jest.fn(() => ({
      id: "mock-camera-device",
      position: "back",
    })),
    useCodeScanner: jest.fn(config => config),
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
jest.mock("react-native-localize", () => mockLocalize);

jest.mock("react-redux", () => {
  const actual = jest.requireActual("react-redux");
  const withTypesSupport = hook => {
    hook.withTypes = () => hook;
    return hook;
  };
  return {
    ...actual,
    useDispatch: withTypesSupport(actual.useDispatch),
    useSelector: withTypesSupport(actual.useSelector),
    useStore: withTypesSupport(actual.useStore),
  };
});

jest.mock("@react-native-async-storage/async-storage", () => mockAsyncStorage);

jest.mock("@gorhom/bottom-sheet", () => mockGorhomBottomSheet);

jest.mock("react-native-version-number", () => ({
  appVersion: "1.0.0",
  buildVersion: "1",
}));

jest.mock("react-native-startup-time", () => ({
  getStartupTime: jest.fn(),
}));

jest.mock("@react-native-community/netinfo", () => mockRNCNetInfo);

jest.mock("react-native-safe-area-context", () => mockSafeAreaContext);

// Mock react-native-worklets using official mock (must be before reanimated)
// https://docs.swmansion.com/react-native-worklets/docs/guides/testing/#javascript
jest.mock("react-native-worklets", () => require("react-native-worklets/lib/module/mock"));

// Setup Reanimated testing environment
require("react-native-reanimated").setUpTests();

jest.mock("~/analytics", () => ({
  ...jest.requireActual("~/analytics"),
  track: jest.fn(),
  updateIdentify: jest.fn(),
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

/*
 * Mock `@react-native-firebase/remote-config` because importing causes:
 * SyntaxError: Cannot use import statement outside a module
 */
jest.mock("@react-native-firebase/remote-config", () => {
  const rc = {
    getValue: jest.fn().mockReturnValue(),
    setConfigSettings: jest.fn().mockResolvedValue(null),
    setDefaults: jest.fn().mockResolvedValue(null),
    fetchAndActivate: jest.fn().mockResolvedValue(null),
  };
  return { getRemoteConfig: jest.fn().mockReturnValue(rc) };
});

jest.mock("@braze/react-native-sdk", () => ({}));

jest.mock("react-native-webview", () => jest.fn());

jest.mock("react-native-linear-gradient", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

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

// Mock isCurrencySupported globally for tests
jest.mock("@ledgerhq/coin-framework/currencies/support", () => {
  const actual = jest.requireActual("@ledgerhq/coin-framework/currencies/support");
  return {
    ...actual,
    isCurrencySupported: jest.fn(() => true),
  };
});
